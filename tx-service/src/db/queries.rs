use std::str::FromStr;

use anyhow::Result;
use diesel::{
    AggregateExpressionMethods, ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl,
    SelectableHelper, SqliteConnection, TextExpressionMethods, dsl, insert_into, sql_types::Date,
    update,
};
use fastcrypto::encoding::{Base64, Encoding};
use iota_types::{
    base_types::IotaAddress, transaction::TransactionData, transaction::TransactionDataAPI,
};

use crate::db::schema::{StoredTransaction, transactions};

pub fn insert_transaction(
    conn: &mut SqliteConnection,
    tx_data: &TransactionData,
    description: Option<String>,
    at: u64,
) -> Result<()> {
    let sender = tx_data.sender();
    let encoded_tx_base64 = Base64::encode(&bcs::to_bytes(tx_data)?);

    insert_into(transactions::table)
        .values((
            transactions::digest.eq(tx_data.digest().to_string()),
            transactions::sender.eq(sender.to_string()),
            transactions::tx_data.eq(encoded_tx_base64),
            transactions::added_at.eq(at as i64),
            transactions::description.eq(description),
        ))
        .execute(conn)?;
    Ok(())
}

pub fn get_transaction_by_digest(
    conn: &mut SqliteConnection,
    digest: &str,
) -> Result<StoredTransaction> {
    let result = transactions::table
        .filter(transactions::digest.eq(digest))
        .get_result(conn)
        .optional()?;
    if let Some(stored) = result {
        // we return the base64 encoded string directly
        Ok(stored)
    } else {
        Err(anyhow::anyhow!("Transaction not found"))
    }
}

pub fn get_transactions_by_sender(
    conn: &mut SqliteConnection,
    sender: &IotaAddress,
) -> Result<Vec<String>> {
    let results = transactions::table
        .filter(transactions::sender.eq(sender.to_string()))
        .select(transactions::tx_data)
        .load::<String>(conn)?;
    Ok(results)
}
