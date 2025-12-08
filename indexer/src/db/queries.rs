use std::str::FromStr;

use anyhow::Result;
use diesel::{
    AggregateExpressionMethods, ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl,
    SelectableHelper, SqliteConnection, TextExpressionMethods, dsl, insert_into, update,
};
use iota_types::base_types::IotaAddress;

use crate::db::schema::members;
use crate::db::schema::approvals;
use crate::db::schema::transactions;
use crate::db::models;

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
) -> Result<Vec<models::StoredTransaction>> {
    let results = transactions::table
        .filter(transactions::account_address.eq(account.to_string()))
        .load::<models::StoredTransaction>(conn)?;
    Ok(results)
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
        update(transactions::table
            .filter(transactions::transaction_digest.eq(tx_digest)))
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
    approver: &IotaAddress,
    approver_weight: u64,
    at: u64,
) -> Result<()> {
    insert_into(approvals::table)
        .values((
            approvals::transaction_digest.eq(tx_digest),
            approvals::approver_address.eq(approver.to_string()),
            approvals::approver_weight.eq(approver_weight as i32),
            approvals::approved_at.eq(at as i64),
        ))
        .execute(conn)?;
    Ok(())
}
