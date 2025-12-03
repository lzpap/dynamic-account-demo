use fastcrypto::encoding::{Base64, Encoding};
use iota_types::{base_types::IotaAddress, event::Event};
use serde::{Deserialize, Serialize};
use tracing::warn;

use crate::config::IsafeIndexerConfig;

pub(crate) enum IsafeEvent {
    AccountCreated(AccountCreatedEvent),
}

impl IsafeEvent {
    pub(crate) fn try_from_event(
        event: &Event,
        config: &IsafeIndexerConfig,
    ) -> anyhow::Result<Option<Self>> {
        if !config.is_isafe_package(event.package_id) {
            warn!(
                "Skipping event from non-iSafe package: {}",
                event.package_id
            );
            return Ok(None);
        }

        Ok(match event.type_.name.as_str() {
            "AccountCreatedEvent" => Some(Self::AccountCreated(bcs::from_bytes(&event.contents)?)),
            _ => None,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountCreatedEvent {
    pub account_id: IotaAddress,
    pub members: Vec<Member>,
    pub threshold: u64,
    pub guardian: Vec<u8>,
    pub authenticator: AuthenticatorInfoV1,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub member_address: IotaAddress,
    pub weight: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthenticatorInfoV1 {
    pub package: IotaAddress,
    pub module_name: String,
    pub function_name: String,
}

#[test]
pub fn test_account_created_event_deserialization() {
    let event_bytes= Base64::decode("/2qYBvCnVn9HPRgwDeCjz0NFdduBUIgzhrD399GlwBUCnbainosG6UkVCFCsf575eDx/PAtZYPqqrD9d6ODN2K4BAAAAAAAAAP/e+4x+S16PmwJJtybt+9LGRuC4ukzVO5R5/aSN6Xg+AQAAAAAAAAACAAAAAAAAAACRBVD3iYp22KeVsnhzftf2NAaNClBqonAfepop8s+uhQxkeW5hbWljX2F1dGgMYXV0aGVudGljYXRl").unwrap();
    let account_created_event: AccountCreatedEvent = bcs::from_bytes(&event_bytes).unwrap();
    assert_eq!(
        account_created_event.account_id.to_string(),
        "0xff6a9806f0a7567f473d18300de0a3cf434575db8150883386b0f7f7d1a5c015"
    );
    assert_eq!(account_created_event.members.len(), 2);
    assert!(
        account_created_event.members[0].member_address.to_string()
            == "0x9db6a29e8b06e949150850ac7f9ef9783c7f3c0b5960faaaac3f5de8e0cdd8ae"
            || account_created_event.members[1].member_address.to_string()
                == "0xffdefb8c7e4b5e8f9b0249b726edfbd2c646e0b8ba4cd53b9479fda48de9783e"
    );
    assert!(
        account_created_event.members[0].weight == 1
            || account_created_event.members[1].weight == 1
    );
    assert_eq!(account_created_event.threshold, 2);
    assert!(
        account_created_event.authenticator.package.to_string()
            == "0x910550f7898a76d8a795b278737ed7f634068d0a506aa2701f7a9a29f2cfae85"
    );
    assert!(account_created_event.authenticator.module_name == "dynamic_auth");
    assert!(account_created_event.authenticator.function_name == "authenticate");
}
