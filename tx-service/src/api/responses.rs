// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use iota_types::base_types::IotaAddress;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionResponse {
    pub bcs: String,
    pub sender: IotaAddress,
    pub added_at: u64,
}

impl axum::response::IntoResponse for TransactionResponse {
    fn into_response(self) -> axum::response::Response {
        axum::Json(self).into_response()
    }
}

// Request body
#[derive(Deserialize)]
pub struct AddTxRequest {
    pub tx_bytes: String,
}

// Response body
#[derive(Serialize)]
pub struct AddTxResponse {
    pub digest: String,
    pub added_at: u64,
}
