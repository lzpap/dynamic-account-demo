// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::str::FromStr;

use axum::{
    Router,
    extract::{Path, State},
    routing::get,
};
use iota_types::{base_types::IotaAddress};
use tower_http::cors::{Any, CorsLayer};
use crate::db::queries;

use crate::{
    api::{
        ApiState,
        error::ApiError,
        responses::{GetAccountsResponse, GetTransactionsResponse},
    },
};

pub fn routes() -> Router<ApiState> {
    Router::new()
        .route("/health", get(health_check))
        .route("/accounts/{member_address}", get(get_accounts))
        .route("/transactions/{account_address}", get(get_transactions)) 
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

async fn get_accounts(
    State(state): State<ApiState>,
    Path(member_address): Path<String>,
) -> Result<GetAccountsResponse, ApiError> {
    let address = IotaAddress::from_str(&member_address)
        .map_err(|_| ApiError::BadRequest("Invalid IOTA address".to_string()))?;

    let mut conn = state.pool.get_connection().map_err(|err| ApiError::Database(err))?;

    let accounts = queries::get_accounts_for_member(&mut conn, &address).map_err(|err| ApiError::Database(err))?;

    Ok(GetAccountsResponse { accounts })
}

async fn get_transactions(
    State(state): State<ApiState>,
    Path(account_address): Path<String>,
) -> Result<GetTransactionsResponse, ApiError> {
    let address = IotaAddress::from_str(&account_address)
        .map_err(|_| ApiError::BadRequest("Invalid account address".to_string()))?;
    let mut conn = state.pool.get_connection().map_err(|err| ApiError::Database(err))?;

    let transactions = queries::get_transactions_for_account(&mut conn, &address)
        .map_err(|err| ApiError::Database(err))?;


    Ok(GetTransactionsResponse { transactions })
}
