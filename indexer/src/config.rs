// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::str::FromStr;

use iota_types::base_types::IotaAddress;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct IsafeIndexerConfig {
    /// Address of the isafe package.
    pub package_address: IotaAddress,
}

impl Default for IsafeIndexerConfig {
    fn default() -> Self {
        Self::from_env().expect("Failed to load iSafe indexer config from environment variables")
    }
}

impl IsafeIndexerConfig {
    pub fn new(package_address: IotaAddress) -> Self {
        Self { package_address }
    }

    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self::new(std::env::var("ISAFE_PACKAGE_ADDRESS")?.parse()?))
    }

    // Create a config based on the package published on devnet.
    #[expect(unused)]
    pub fn devnet() -> Self {
        // TODO change on devnet deployment
        const ISAFE_PACKAGE_ADDRESS: &str =
            "0x233478c5db4cc8724a94fdbc24ec6d613177280c02623b768e8b749f7b1d8e03";

        let package_address = IotaAddress::from_str(ISAFE_PACKAGE_ADDRESS).unwrap();

        Self::new(package_address)
    }

    /// Checks whether the given package address is an iSage one.
    pub fn is_isafe_package(&self, package_address: impl Into<IotaAddress>) -> bool {
        let package_address = package_address.into();

        package_address == self.package_address
    }
}
