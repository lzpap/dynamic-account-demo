// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use iota_types::base_types::IotaAddress;
use serde::{Deserialize, Serialize};

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
