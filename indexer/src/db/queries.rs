use std::str::FromStr;

use anyhow::Result;
use diesel::{
    Connection, ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SqliteConnection,
    dsl, insert_into, update,
};
use iota_types::base_types::IotaAddress;

use crate::db::models;
use crate::db::models::TransactionSummary;
use crate::db::schema::approvals;
use crate::db::schema::members;
use crate::db::schema::transactions;
use crate::db::schema::accounts;

pub fn insert_new_account_entry(
    conn: &mut SqliteConnection,
    account: IotaAddress,
    threshold: u64,
    authenticator: String,
    at: u64,
) -> Result<()> {
    insert_into(crate::db::schema::accounts::table)
        .values((
            crate::db::schema::accounts::account_address.eq(account.to_string()),
            crate::db::schema::accounts::threshold.eq(threshold as i32),
            crate::db::schema::accounts::authenticator.eq(authenticator),
            crate::db::schema::accounts::created_at.eq(at as i64),
        ))
        .execute(conn)?;
    Ok(())
}

pub fn insert_member_entry(
    conn: &mut SqliteConnection,
    account: IotaAddress,
    member: IotaAddress,
    _weight: u64,
    at: u64,
) -> Result<()> {
    insert_into(members::table)
        .values((
            members::account_address.eq(account.to_string()),
            members::member_address.eq(member.to_string()),
            members::weight.eq(_weight as i32),
            members::added_at.eq(at as i64),
        ))
        .execute(conn)?;
    Ok(())
}

pub fn get_accounts_for_member(
    conn: &mut SqliteConnection,
    member: &IotaAddress,
) -> Result<Vec<IotaAddress>> {
    let results = members::table
        .filter(members::member_address.eq(member.to_string()))
        .select(members::account_address)
        .load::<String>(conn)?;

    let accounts = results
        .into_iter()
        .filter_map(|addr_str| IotaAddress::from_str(&addr_str).ok())
        .collect();

    Ok(accounts)
}

pub fn get_transactions_for_account(
    conn: &mut SqliteConnection,
    account: &IotaAddress,
) -> Result<Vec<TransactionSummary>> {
    // Use a transaction to ensure atomic reads across multiple tables
    conn.transaction(|conn| {
        let account_str = account.to_string();

        // 1. Get account threshold
        let threshold: i32 = accounts::table
            .filter(accounts::account_address.eq(&account_str))
            .select(accounts::threshold)
            .first::<i32>(conn)?;

        // 2. Get total weight of all members for this account
        let total_weight: i64 = members::table
            .filter(members::account_address.eq(&account_str))
            .select(dsl::sum(members::weight))
            .first::<Option<i64>>(conn)?
            .unwrap_or(0);

        // 3. Get all transactions for this account
        let stored_transactions = transactions::table
            .filter(transactions::account_address.eq(&account_str))
            .load::<models::StoredTransaction>(conn)?;

        // 4. For each transaction, get its approvals and build the summary
        let mut summaries = Vec::new();
        for tx in stored_transactions {
            // Get approver addresses for this transaction
            let approved_by: Vec<IotaAddress> = approvals::table
                .filter(approvals::transaction_digest.eq(&tx.transaction_digest))
                .filter(approvals::account_address.eq(&account_str))
                .select(approvals::approver_address)
                .load::<String>(conn)?
                .into_iter()
                .filter_map(|addr| IotaAddress::from_str(&addr).ok())
                .collect();

            // Get sum of approval weights
            let current_approvals: i64 = approvals::table
                .filter(approvals::transaction_digest.eq(&tx.transaction_digest))
                .filter(approvals::account_address.eq(&account_str))
                .select(dsl::sum(approvals::approver_weight))
                .first::<Option<i64>>(conn)?
                .unwrap_or(0);

            summaries.push(TransactionSummary {
                transaction_digest: tx.transaction_digest,
                proposer_address: IotaAddress::from_str(&tx.proposer_address)
                    .unwrap_or(IotaAddress::ZERO),
                status: tx.status.into(),
                current_approvals: current_approvals as u64,
                threshold: threshold as u64,
                total_account_weight: total_weight as u64,
                approved_by,
                created_at: tx.created_at,
            });
        }

        Ok(summaries)
    })
}

pub fn update_transaction_status(
    conn: &mut SqliteConnection,
    tx_digest: String,
    status: String,
) -> Result<()> {
    let existing_tx = transactions::table
        .filter(transactions::transaction_digest.eq(tx_digest.clone()))
        .first::<models::StoredTransaction>(conn)
        .optional()?;

    if let Some(_) = existing_tx {
        update(transactions::table.filter(transactions::transaction_digest.eq(tx_digest)))
            .set(transactions::status.eq(status))
            .execute(conn)?;
    } else {
        return Err(anyhow::anyhow!("Transaction not found"));
    }
    Ok(())
}

pub fn insert_transaction_entry(
    conn: &mut SqliteConnection,
    tx_digest: String,
    account: &IotaAddress,
    proposer: &IotaAddress,
    status: String,
    at: u64,
) -> Result<()> {
    insert_into(transactions::table)
        .values((
            transactions::transaction_digest.eq(tx_digest),
            transactions::account_address.eq(account.to_string()),
            transactions::proposer_address.eq(proposer.to_string()),
            transactions::status.eq(status),
            transactions::created_at.eq(at as i64),
        ))
        .execute(conn)?;
    Ok(())
}

pub fn insert_approval_entry(
    conn: &mut SqliteConnection,
    tx_digest: String,
    account: &IotaAddress,
    approver: &IotaAddress,
    approver_weight: u64,
    at: u64,
) -> Result<()> {
    insert_into(approvals::table)
        .values((
            approvals::transaction_digest.eq(tx_digest),
            approvals::account_address.eq(account.to_string()),
            approvals::approver_address.eq(approver.to_string()),
            approvals::approver_weight.eq(approver_weight as i32),
            approvals::approved_at.eq(at as i64),
        ))
        .execute(conn)?;
    Ok(())
}
