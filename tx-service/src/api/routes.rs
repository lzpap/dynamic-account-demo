// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::str::FromStr;

use axum::{
    Router,
    extract::{Json, Path, State},
    routing::get,
    routing::post,
};
use chrono::{Local, Utc};
use fastcrypto::encoding::{Base64, Encoding};
use iota_types::{
    base_types::IotaAddress, digests::TransactionDigest, transaction::TransactionDataAPI,
};
use tower_http::cors::{Any, CorsLayer};

use crate::{
    api::{
        ApiState,
        error::ApiError,
        responses::{AddTxRequest, AddTxResponse, TransactionResponse},
    },
    db::{queries, schema::transactions::digest},
};

pub fn routes() -> Router<ApiState> {
    Router::new()
        .route("/health", get(health_check))
        .route("/transaction/{tx_digest}", get(get_transaction_by_digest))
        .route("/add_transaction", post(add_transaction))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
}

async fn health_check() -> &'static str {
    "OK"
}

async fn get_transaction_by_digest(
    State(state): State<ApiState>,
    Path(tx_digest): Path<String>,
) -> Result<TransactionResponse, ApiError> {
    let _ = TransactionDigest::from_str(&tx_digest)
        .map_err(|_| ApiError::BadRequest("Invalid IOTA transaction digest".to_string()))?;

    let mut conn = state
        .pool
        .get_connection()
        .map_err(|err| ApiError::Database(err))?;

    let tx = queries::get_transaction_by_digest(&mut conn, &tx_digest)
        .map_err(|err| ApiError::Database(err))?;

    Ok(TransactionResponse {
        bcs: tx.tx_data,
        sender: IotaAddress::from_str(&tx.sender).map_err(|err| ApiError::Internal(err))?,
        added_at: tx.added_at as u64,
    })
}

async fn add_transaction(
    State(state): State<ApiState>,
    Json(payload): Json<AddTxRequest>,
) -> Result<Json<AddTxResponse>, ApiError> {
    let sender_signed_data = bcs::from_bytes::<iota_types::transaction::SenderSignedData>(
        &Base64::decode(&payload.tx_bytes)
            .map_err(|_| ApiError::BadRequest("Invalid base64 transaction bytes".to_string()))?,
    )
    .map_err(|_| ApiError::BadRequest("Invalid transaction data".to_string()))?;

    // TODO: expect a TransactionData instead of SenderSignedData
    let tx_data = sender_signed_data.transaction_data();

    let tx_digest = tx_data.digest();
    let now = Utc::now().timestamp() as u64;

    let mut conn = state
        .pool
        .get_connection()
        .map_err(|err| ApiError::Database(err))?;

    queries::insert_transaction(&mut conn, &tx_data, now).map_err(|err| ApiError::Database(err))?;
    Ok(Json(AddTxResponse {
        digest: tx_digest.to_string(),
        added_at: now,
    }))
}
