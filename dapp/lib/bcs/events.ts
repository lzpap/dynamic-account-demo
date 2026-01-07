import { bcs } from "@iota/iota-sdk/bcs";
import { fromBase58, toBase58 } from "@iota/iota-sdk/utils";

export const Member = bcs.struct("Member", {
  addr: bcs.Address,
  weight: bcs.u64(),
});

export const AccountCreatedEvent = bcs.struct("AccountCreatedEvent", {
  account: bcs.Address,
  members: bcs.vector(Member),
  threshold: bcs.u64(),
  guardian: bcs.vector(bcs.u8()),
  authenticator: bcs.struct("AuthenticatorInfoV1", {
    package: bcs.struct("ID", {
      bytes: bcs.Address,
    }),
    moduleName: bcs.string(),
    functionName: bcs.string(),
  }),
});

export const AccountRotatedEvent = bcs.struct("AccountRotatedEvent", {
  account: bcs.Address,
  members: bcs.vector(Member),
  threshold: bcs.u64(),
  guardian: bcs.vector(bcs.u8()),
  authenticator: bcs.struct("AuthenticatorInfoV1", {
    package: bcs.struct("ID", {
      bytes: bcs.Address,
    }),
    moduleName: bcs.string(),
    functionName: bcs.string(),
  }),
});

export const MemberAddedEvent = bcs.struct("MemberAddedEvent", {
  account: bcs.Address,
  member: Member,
});

export const MemberRemovedEvent = bcs.struct("MemberRemovedEvent", {
  account: bcs.Address,
  member: Member,
});

export const MemberWeightUpdatedEvent = bcs.struct("MemberWeightUpdatedEvent", {
  account: bcs.Address,
  member: Member,
  oldWeight: bcs.u64(),
  newWeight: bcs.u64(),
});

export const ThresholdChangedEvent = bcs.struct("ThresholdChangedEvent", {
  account: bcs.Address,
  oldThreshold: bcs.u64(),
  newThreshold: bcs.u64(),
});

export const GuardianChangedEvent = bcs.struct("GuardianChangedEvent", {
  account: bcs.Address,
  oldGuardian: bcs.vector(bcs.u8()),
  newGuardian: bcs.vector(bcs.u8()),
});

export const TransactionProposedEvent = bcs.struct("TransactionProposedEvent", {
  account: bcs.Address,
  transactionDigest: bcs.vector(bcs.u8()),
  proposer: bcs.Address,
});

export const TransactionApprovedEvent = bcs.struct("TransactionApprovedEvent", {
  account: bcs.Address,
  transactionDigest: bcs.vector(bcs.u8()),
  approver: bcs.Address,
  approverWeight: bcs.u64(),
  totalWeightApproving: bcs.u64(),
});

export const TransactionApprovalThresholdReachedEvent = bcs.struct("TransactionApprovalThresholdReachedEvent", {
  account: bcs.Address,
  transactionDigest: bcs.vector(bcs.u8()),
  totalApprovingWeight: bcs.u64(),
  threshold: bcs.u64(),
});

export const TransactionApprovalThresholdLostEvent = bcs.struct("TransactionApprovalThresholdLostEvent", {
  account: bcs.Address,
  transactionDigest: bcs.vector(bcs.u8()),
  totalApprovingWeight: bcs.u64(),
  threshold: bcs.u64(),
});

export const TransactionExecutedEvent = bcs.struct("TransactionExecutedEvent", {
  account: bcs.Address,
  transactionDigest: bcs.vector(bcs.u8()),
  totalMemberWeight: bcs.u64(),
  approvers: bcs.vector(bcs.Address),
  approverWeights: bcs.vector(bcs.u64()),
  threshold: bcs.u64(),
});

export const TransactionRemovedEvent = bcs.struct("TransactionRemovedEvent", {
  account: bcs.Address,
  transactionDigest: bcs.vector(bcs.u8()),
});