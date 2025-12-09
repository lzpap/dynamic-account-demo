use axum::extract::FromRef;
use futures::FutureExt;
use std::{panic::AssertUnwindSafe, path::PathBuf, sync::Arc};

use iota_data_ingestion_core::{
    DataIngestionMetrics, FileProgressStore, IndexerExecutor, ReaderOptions, Worker, WorkerPool,
    reader::v2::{CheckpointReaderConfig, RemoteUrl},
};
use iota_json_rpc_types::{IotaObjectDataOptions, IotaTransactionBlockResponseOptions};
use iota_sdk::IotaClientBuilder;
use iota_types::{
    base_types::ObjectID, digests::TransactionDigest, effects::{TransactionEffects, TransactionEffectsAPI}, execution_status::ExecutionStatus, full_checkpoint_content::{CheckpointData, CheckpointTransaction}
};

use diesel::Connection;

use crate::db::{pool::DbConnectionPool, queries};
use crate::{config::IsafeIndexerConfig, events::IsafeEvent};
use crate::db::models::Status;
use anyhow::{Result, anyhow, bail};
use async_trait::async_trait;
use prometheus::Registry;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, warn};

pub(crate) async fn run_isafe_reader(
    worker: IsafeWorker,
    node_url: &str,
    checkpoint_url: &str,
    registry: &Registry,
    concurrency: usize,
) -> anyhow::Result<()> {
    let progress_store_path = "./data/progress_store";
    initialize_progress_store(&worker, node_url, progress_store_path).await?;

    let progress_store = FileProgressStore::new(progress_store_path).await?;

    let mut executor = IndexerExecutor::new(
        progress_store,
        1,
        DataIngestionMetrics::new(registry),
        worker.token.clone(),
    );
    let worker_pool = WorkerPool::new(
        worker,
        "isafe_reader".to_string(),
        concurrency,
        Default::default(),
    );
    executor.register(worker_pool).await?;

    info!("Connecting to {checkpoint_url} to sync checkpoints");
    let reader_options = ReaderOptions {
        timeout_secs: 60,
        ..Default::default()
    };
    // Localnet does not support remote store, so we use the REST API
    if checkpoint_url.contains("localhost") || checkpoint_url.contains("host.docker.internal") {
        executor
            .run(
                // path to a local directory where checkpoints are stored.
                PathBuf::from("./data/chk"),
                Some(format!("{checkpoint_url}/api/v1")),
                // optional remote store access options.
                vec![],
                reader_options,
            )
            .await?;
    } else {
        let config = CheckpointReaderConfig {
            remote_store_url: Some(RemoteUrl::HybridHistoricalStore {
                historical_url: format!("{checkpoint_url}/ingestion/historical"),
                live_url: Some(format!("{checkpoint_url}/ingestion/live")),
            }),
            ingestion_path: Some(PathBuf::from("./data/chk")),
            reader_options,
        };
        executor.run_with_config(config).await?;
    }
    Ok(())
}

pub(crate) struct IsafeWorker {
    pool: DbConnectionPool,
    config: IsafeIndexerConfig,
    token: CancellationToken,
}

impl IsafeWorker {
    pub(crate) fn new(
        pool: DbConnectionPool,
        config: IsafeIndexerConfig,
        token: CancellationToken,
    ) -> anyhow::Result<Self> {
        Ok(Self {
            pool,
            config,
            token,
        })
    }

    async fn process_checkpoint(&self, checkpoint: &CheckpointData) -> anyhow::Result<()> {
        debug!(
            "Processing checkpoint: {}",
            checkpoint.checkpoint_summary.sequence_number
        );
        // TODO: implement the actual processing logic here
        for transaction in &checkpoint.transactions {
            let TransactionEffects::V1(effects) = &transaction.effects;

            if *effects.status() != ExecutionStatus::Success {
                continue;
            }

            let timestamp = checkpoint.checkpoint_summary.timestamp_ms;

            if let Some(events) = &transaction.events {
                for event in events.data.iter() {
                    match IsafeEvent::try_from_event(event, &self.config) {
                        Ok(Some(event)) => self.process_event(event, timestamp)?,
                        Err(e) => warn!("parsing event failed: {e}"),
                        _ => {}
                    }
                }
            }
            self.process_transaction(transaction)?;
        }

        Ok(())
    }

    fn process_transaction(&self, transaction: &CheckpointTransaction) -> anyhow::Result<()> {
        // We could exract the sender and look into our DB to see if there exists an account with that id
        // But this would be highly inefficient to do for every transaction
        // Instead, we could take a look at the input objects and see if any of them is an account object + the sender is the account
        // TODO: This will not work for now as the checkpoint content doesn't have the authenticator inputs yet...
        let expexted_type = format!("{}::account::Account", self.config.package_address);
        for input in transaction.input_objects.iter() {
            match  input.struct_tag() {
                Some(tag) if tag.to_canonical_string(true) == expexted_type => {
                    // If this object id is the sender of the tx, we have a hit
                    if transaction.transaction.sender_address().to_inner() == input.id().into_bytes() {
                        let mut conn = self.pool.get_connection()?;
                        let tx_digest = transaction.transaction.digest().to_string();
                        conn.transaction::<_, anyhow::Error, _>(|conn| {
                            queries::update_transaction_status(conn, tx_digest.clone(), Status::Executed.into())
                        })?;
                        info!(
                            "Updated transaction {} status to Executed",
                            tx_digest
                        );
                        break;
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }

    fn process_event(&self, event: IsafeEvent, timestamp: u64) -> anyhow::Result<()> {
        match event {
            IsafeEvent::AccountCreated(acct_event) => {
                info!(
                    "Processing AccountCreated event for account: {}",
                    acct_event.account_id
                );
                let mut conn = self.pool.get_connection()?;
                
                // First, insert the account itself
                let authenticator = format!(
                    "{}::{}::{}",
                    acct_event.authenticator.package,
                    acct_event.authenticator.module_name,
                    acct_event.authenticator.function_name
                );
                conn.transaction::<_, anyhow::Error, _>(|conn| {
                    queries::insert_new_account_entry(
                        conn,
                        acct_event.account_id,
                        acct_event.threshold,
                        authenticator,
                        timestamp,
                    )
                })?;
                info!(
                    "Created account {} with threshold {}",
                    acct_event.account_id, acct_event.threshold
                );

                // Then insert members
                for member in acct_event.members {
                    conn.transaction::<_, anyhow::Error, _>(|conn| {
                        queries::insert_member_entry(
                            conn,
                            acct_event.account_id,
                            member.member_address,
                            member.weight,
                            timestamp,
                        )
                    })?;
                    info!(
                        "Added member {} with weight {} to account {}",
                        member.member_address, member.weight, acct_event.account_id
                    );
                }
            }
            IsafeEvent::TransactionProposed(tx_event) => {
                // on-chain type shall always be 32 bytes
                let tx_digest_bytes: [u8; 32] = tx_event.transaction_digest.try_into().expect("Invalid transaction digest length");
                let tx_digest = TransactionDigest::from(tx_digest_bytes);
                info!(
                    "Processing TransactionProposed event for transaction: {:?}",
                    tx_digest
                );
                let mut conn = self.pool.get_connection()?;
                conn.transaction::<_, anyhow::Error, _>(|conn| {
                    queries::insert_transaction_entry(
                        conn,
                        tx_digest.to_string(),
                        &tx_event.account_id,
                        &tx_event.proposer,
                        Status::Proposed.into(),
                        timestamp,
                    )
                })?;
                info!(
                    "Inserted proposed transaction {} for account {}",
                    tx_digest.to_string(),
                    tx_event.account_id
                );
            }
            IsafeEvent::TransactionApproved(tx_event) => {
                let tx_digest_bytes: [u8; 32] = tx_event.transaction_digest.try_into().expect("Invalid transaction digest length");
                let tx_digest = TransactionDigest::from(tx_digest_bytes);
                info!(
                    "Processing TransactionApproved event for transaction: {:?}",
                    tx_digest
                );
                let mut conn = self.pool.get_connection()?;
                conn.transaction::<_, anyhow::Error, _>(|conn| {
                    queries::insert_approval_entry(
                        conn,
                        tx_digest.to_string(),
                        &tx_event.approver,
                        tx_event.approver_weight,
                        timestamp,
                    )
                })?;
                info!(
                    "Inserted approval for transaction {} by approver {}",
                    tx_digest.to_string(),
                    tx_event.approver
                );
            }
            IsafeEvent::TransactionApprovalThresholdReached(tx_event) => {
                let tx_digest_bytes: [u8; 32] = tx_event.transaction_digest.try_into().expect("Invalid transaction digest length");
                let tx_digest = TransactionDigest::from(tx_digest_bytes);
                info!(
                    "Processing TransactionApprovalThresholdReached event for transaction: {:?}",
                    tx_digest
                );
                let mut conn = self.pool.get_connection()?;
                conn.transaction::<_, anyhow::Error, _>(|conn| {
                    queries::update_transaction_status(
                        conn,
                        tx_digest.to_string(),
                        Status::Approved.into(),
                    )
                })?;
                info!(
                    "Updated transaction {} status to Approved",
                    tx_digest.to_string()
                );
            }
        }
        Ok(())
    }
}

#[async_trait]
impl Worker for IsafeWorker {
    type Message = ();
    type Error = anyhow::Error;

    async fn process_checkpoint(
        &self,
        checkpoint: Arc<CheckpointData>,
    ) -> Result<Self::Message, Self::Error> {
        let res = AssertUnwindSafe(self.process_checkpoint(&checkpoint))
            .catch_unwind()
            .await
            .map_err(map_panic);
        if let Err(e) | Ok(Err(e)) = &res {
            tracing::error!("{e}");
            self.token.cancel();
        }
        res?
    }
}

async fn initialize_progress_store(
    worker: &IsafeWorker,
    node_url: &str,
    progress_store_path: &str,
) -> anyhow::Result<()> {
    if std::path::Path::new(progress_store_path).exists() {
        return Ok(());
    }

    info!("Progress store file not found, creating with initial checkpoint");
    let client = IotaClientBuilder::default().build(node_url).await?;

    let package_id = &worker.config.package_address;
    let mut checkpoint: u64 = 0;

    match get_package_deployment_checkpoint(&client, package_id).await {
        Err(e) => {
            // If we can't get the deployment checkpoint, we default to the last known checkpoint
            let current_checkpoint = client
                .read_api()
                .get_latest_checkpoint_sequence_number()
                .await?;
            warn!(
                "Failed to get package deployment checkpoint: {e}, defaulting to current checkpoint of {current_checkpoint}"
            );
            checkpoint = current_checkpoint;
        }
        Ok(deployed_at) => {
            info!("Package deployed at checkpoint: {deployed_at}");
            checkpoint = deployed_at;
        }
    }

    // Create the data directory if it doesn't exist
    std::fs::create_dir_all("./data")?;

    let progress_content = serde_json::json!({
        "isafe_reader": checkpoint
    });
    info!("Setting progress store checkpoint to: {checkpoint}");
    std::fs::write(
        progress_store_path,
        serde_json::to_string_pretty(&progress_content)?,
    )?;

    Ok(())
}

/// Maps a panic payload to an error.
///
/// A invocation of the panic!() macro in Rust 2021 or later will always result
/// in a panic payload of type &'static str or String.
///
/// Only an invocation of panic_any (or, in Rust 2018 and earlier, panic!(x)
/// where x is something other than a string) can result in a panic payload
/// other than a &'static str or String.
/// See https://doc.rust-lang.org/stable/std/panic/struct.PanicHookInfo.html for more info
fn map_panic(payload: Box<dyn std::any::Any + Send + 'static>) -> anyhow::Error {
    if let Some(s) = payload.downcast_ref::<&str>() {
        anyhow!("{s}")
    } else if let Some(s) = payload.downcast_ref::<String>() {
        anyhow!("{s}")
    } else {
        anyhow!("unknown panic occurred")
    }
}

async fn get_package_deployment_checkpoint(
    client: &iota_sdk::IotaClient,
    package_address: &iota_types::base_types::IotaAddress,
) -> anyhow::Result<u64> {
    let object_response = client
        .read_api()
        .get_object_with_options(
            ObjectID::from(*package_address),
            IotaObjectDataOptions::default().with_previous_transaction(),
        )
        .await?;

    if let Some(error) = object_response.error {
        bail!("Failed to fetch package object: {error}");
    }

    let tx_response = client
        .read_api()
        .get_transaction_with_options(
            object_response.data.unwrap().previous_transaction.unwrap(),
            IotaTransactionBlockResponseOptions::default(),
        )
        .await?;
    if !tx_response.errors.is_empty() {
        bail!("Failed to fetch transaction: {:?}", tx_response.errors);
    }

    tx_response
        .checkpoint
        .ok_or_else(|| anyhow::anyhow!("Missing checkpoint"))
}
