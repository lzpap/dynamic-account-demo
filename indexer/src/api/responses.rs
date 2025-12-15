// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use iota_types::{base_types::IotaAddress};
use serde::{Deserialize, Serialize};
use crate::db::models::{TransactionSummary};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetAccountsResponse {
    pub accounts: Vec<IotaAddress>,
}

impl axum::response::IntoResponse for GetAccountsResponse {
    fn into_response(self) -> axum::response::Response {
        axum::Json(self).into_response()
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTransactionsResponse {
    pub transactions: Vec<TransactionSummary>,
}

impl axum::response::IntoResponse for GetTransactionsResponse {
    fn into_response(self) -> axum::response::Response {
        axum::Json(self).into_response()
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    pub account_address: IotaAddress,
    pub firing_tx_digest: String,
    pub event_type: String,
    pub event_data: String,
    pub timestamp: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetEventsResponse {
    pub events: Vec<Event>,
}

impl axum::response::IntoResponse for GetEventsResponse {
    fn into_response(self) -> axum::response::Response {
        axum::Json(self).into_response()
    }
}