use fastcrypto::encoding::{Base64, Encoding};
use iota_types::{base_types::IotaAddress, event::Event};
use serde::{Deserialize, Serialize};
use tracing::warn;

use crate::config::IsafeIndexerConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) enum IsafeEvent {
    AccountCreated(AccountCreatedEvent),
    AccountRotated(AccountRotatedEvent),
    MemberAdded(MemberAddedEvent),
    MemberRemoved(MemberRemovedEvent),
    MemberWeightUpdated(MemberWeightUpdatedEvent),
    ThresholdChanged(ThresholdChangedEvent),
    GuardianChanged(GuardianChangedEvent),
    TransactionProposed(TransactionProposedEvent),
    TransactionApproved(TransactionApprovedEvent),
    TransactionApprovalThresholdReached(TransactionApprovalThresholdReachedEvent),
    TransactionApprovalThresholdLost(TransactionApprovalThresholdLostEvent),
    TransactionExecuted(TransactionExecutedEvent),
    TransactionRemoved(TransactionRemovedEvent),
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
            "AccountRotatedEvent" => Some(Self::AccountRotated(bcs::from_bytes(&event.contents)?)),
            "MemberAddedEvent" => Some(Self::MemberAdded(bcs::from_bytes(&event.contents)?)),
            "MemberRemovedEvent" => Some(Self::MemberRemoved(bcs::from_bytes(&event.contents)?)),
            "MemberWeightUpdatedEvent" => Some(Self::MemberWeightUpdated(bcs::from_bytes(&event.contents)?)),
            "ThresholdChangedEvent" => Some(Self::ThresholdChanged(bcs::from_bytes(&event.contents)?)),
            "GuardianChangedEvent" => Some(Self::GuardianChanged(bcs::from_bytes(&event.contents)?)),
            "TransactionProposedEvent" => Some(Self::TransactionProposed(bcs::from_bytes(&event.contents)?)),
            "TransactionApprovedEvent" => Some(Self::TransactionApproved(bcs::from_bytes(&event.contents)?)),
            "TransactionApprovalThresholdReachedEvent" => Some(Self::TransactionApprovalThresholdReached(bcs::from_bytes(&event.contents)?)),
            "TransactionApprovalThresholdLostEvent" => Some(Self::TransactionApprovalThresholdLost(bcs::from_bytes(&event.contents)?)),
            "TransactionExecutedEvent" => Some(Self::TransactionExecuted(bcs::from_bytes(&event.contents)?)),
            "TransactionRemovedEvent" => Some(Self::TransactionRemoved(bcs::from_bytes(&event.contents)?)),
            _ => None,
        })
    }
    pub fn type_(&self) -> &str {
        match self {
            IsafeEvent::AccountCreated(_) => "AccountCreatedEvent",
            IsafeEvent::AccountRotated(_) => "AccountRotatedEvent",
            IsafeEvent::MemberAdded(_) => "MemberAddedEvent",
            IsafeEvent::MemberRemoved(_) => "MemberRemovedEvent",
            IsafeEvent::MemberWeightUpdated(_) => "MemberWeightUpdatedEvent",
            IsafeEvent::ThresholdChanged(_) => "ThresholdChangedEvent",
            IsafeEvent::GuardianChanged(_) => "GuardianChangedEvent",
            IsafeEvent::TransactionProposed(_) => "TransactionProposedEvent",
            IsafeEvent::TransactionApproved(_) => "TransactionApprovedEvent",
            IsafeEvent::TransactionApprovalThresholdReached(_) => "TransactionApprovalThresholdReachedEvent",
            IsafeEvent::TransactionApprovalThresholdLost(_) => "TransactionApprovalThresholdLostEvent",
            IsafeEvent::TransactionExecuted(_) => "TransactionExecutedEvent",
            IsafeEvent::TransactionRemoved(_) => "TransactionRemovedEvent",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountCreatedEvent {
    pub account_id: IotaAddress,
    pub members: Vec<Member>,
    pub threshold: u64,
    pub guardian: Vec<u8>,
    pub authenticator: AuthenticatorFunctionRefV1,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountRotatedEvent {
    pub account_id: IotaAddress,
    pub members: Vec<Member>,
    pub threshold: u64,
    pub guardian: Vec<u8>,
    pub authenticator: AuthenticatorFunctionRefV1,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemberAddedEvent {
    pub account_id: IotaAddress,
    pub member: Member,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemberRemovedEvent {
    pub account_id: IotaAddress,
    pub member: Member,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemberWeightUpdatedEvent {
    pub account_id: IotaAddress,
    pub member: Member,
    pub old_weight: u64,
    pub new_weight: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThresholdChangedEvent {
    pub account_id: IotaAddress,
    pub old_threshold: u64,
    pub new_threshold: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GuardianChangedEvent {
    pub account_id: IotaAddress,
    pub old_guardian: Vec<u8>,
    pub new_guardian: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub member_address: IotaAddress,
    pub weight: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthenticatorFunctionRefV1 {
    pub package: IotaAddress,
    pub module_name: String,
    pub function_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionProposedEvent{
    pub account_id: IotaAddress,
    pub transaction_digest: Vec<u8>,
    pub proposer: IotaAddress,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionApprovedEvent{
    pub account_id: IotaAddress,
    pub transaction_digest: Vec<u8>,
    pub approver: IotaAddress,
    pub approver_weight: u64,
    pub total_approved_weight: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionApprovalThresholdReachedEvent{
    pub account_id: IotaAddress,
    pub transaction_digest: Vec<u8>,
    pub total_approved_weight: u64,
    pub threshold: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionApprovalThresholdLostEvent{
    pub account_id: IotaAddress,
    pub transaction_digest: Vec<u8>,
    pub total_approved_weight: u64,
    pub threshold: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionRemovedEvent{
    pub account_id: IotaAddress,
    pub transaction_digest: Vec<u8>,
}

// This event doesn't exist on-chain, it's for indexing purposes only
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionExecutedEvent{
    pub account_id: IotaAddress,
    pub transaction_digest: Vec<u8>,
    pub total_member_weight: u64,
    pub approvers: Vec<IotaAddress>,
    pub approver_weights: Vec<u64>,
    pub threshold: u64,
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
