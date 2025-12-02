// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::str::FromStr;

use iota_types::base_types::{IotaAddress, ObjectID};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct IsafeIndexerConfig {
    /// Address of the isafe package.
    pub package_address: IotaAddress,
}

impl Default for IsafeIndexerConfig {
    fn default() -> Self {
        Self::devnet()
    }
}

impl IsafeIndexerConfig {
    pub fn new(
        package_address: IotaAddress,
    ) -> Self {
        Self {
            package_address,
        }
    }

    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self::new(
            std::env::var("ISAFE_PACKAGE_ADDRESS")?.parse()?,
        ))
    }

    // Create a config based on the package published on devnet.
    #[expect(unused)]
    pub fn devnet() -> Self {
        // TODO change on devnet deployment
        const ISAFE_PACKAGE_ADDRESS: &str =
            "0x79c8714ea294a92da04875c77ccabf8d1a06107e80d41c23d6777d5b1e6724a5";

        let package_address = IotaAddress::from_str(ISAFE_PACKAGE_ADDRESS).unwrap();

        Self::new(
            package_address,
        )
    }

    /// Checks whether the given package address is an iSage one.
    pub fn is_isafe_package(&self, package_address: impl Into<IotaAddress>) -> bool {
        let package_address = package_address.into();

        package_address == self.package_address
    }
}
