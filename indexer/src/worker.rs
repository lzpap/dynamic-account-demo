use futures::FutureExt;
use std::{panic::AssertUnwindSafe, path::PathBuf, sync::Arc};

use iota_data_ingestion_core::{
    DataIngestionMetrics, FileProgressStore, IndexerExecutor, ReaderOptions, Worker, WorkerPool,
    reader::v2::{CheckpointReaderConfig, RemoteUrl},
};
use iota_json_rpc_types::{IotaObjectDataOptions, IotaTransactionBlockResponseOptions};
use iota_sdk::IotaClientBuilder;
use iota_types::{base_types::ObjectID, full_checkpoint_content::CheckpointData};

use crate::config::IsafeIndexerConfig;
use crate::db::pool::DbConnectionPool;
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
