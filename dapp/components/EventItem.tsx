import React from "react";
import { ParsedEvent } from "@/hooks/useGetAccountEvents";
import {
  AccountCreatedEvent,
  AccountRotatedEvent,
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberWeightUpdatedEvent,
  ThresholdChangedEvent,
  GuardianChangedEvent,
  TransactionProposedEvent,
  TransactionApprovedEvent,
  TransactionApprovalThresholdReachedEvent,
  TransactionExecutedEvent,
  TransactionRemovedEvent,
} from "@/lib/bcs/events";
import { shortenAddress } from "@/lib/utils/shortenAddress";
import { toBase58, toBase64 } from "@iota/iota-sdk/utils";

export const EventItem: React.FC<{ event: ParsedEvent }> = ({ event }) => {
  // Render description and icon based on eventType
  let description = "";
  let icon: React.ReactNode = null;

  switch (event.eventType) {
    case "AccountCreatedEvent":
      const accountCreatedData =
        event.data as typeof AccountCreatedEvent.$inferType;
      const total_weight = accountCreatedData.members.reduce(
        (acc, member) => acc + Number(member.weight),
        0
      );
      description = `Account ${shortenAddress(
        accountCreatedData.account
      )} created (${accountCreatedData.threshold} out of ${total_weight})`;
      icon = (
        // House with plus (new account)
        <svg
          className="w-5 h-5 text-blue-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 12l9-9 9 9" />
          <rect x="6" y="12" width="12" height="8" rx="2" />
          <path d="M12 16v4" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="12" cy="18" r="1.5" fill="#3b82f6" />
        </svg>
      );
      break;
    case "AccountRotatedEvent":
      const accountRotatedData =
        event.data as typeof AccountRotatedEvent.$inferType;
      description = `Account ${shortenAddress(
        accountRotatedData.account
      )} rotated, new authenticator${
        accountRotatedData.authenticator.package
      }:: ${accountRotatedData.authenticator.moduleName}::${
        accountRotatedData.authenticator.functionName
      }`;
      icon = (
        // Rotating arrows (account rotation)
        <svg
          className="w-5 h-5 text-indigo-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4.93 19.07A10 10 0 1121 12.93" strokeWidth="2" />
          <polyline points="23 4 23 10 17 10" strokeWidth="2" />
        </svg>
      );
      break;
    case "MemberAddedEvent":
      const memberAddedData = event.data as typeof MemberAddedEvent.$inferType;
      description = `Member ${shortenAddress(
        memberAddedData.member.addr
      )} added with weight ${memberAddedData.member.weight}`;
      icon = (
        // Person with plus (add member)
        <svg
          className="w-5 h-5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="9" cy="7" r="4" strokeWidth="2" />
          <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" strokeWidth="2" />
          <path d="M19 8v6" strokeWidth="2" />
          <path d="M22 11h-6" strokeWidth="2" />
        </svg>
      );
      break;
    case "MemberRemovedEvent":
      const memberRemovedData =
        event.data as typeof MemberRemovedEvent.$inferType;
      description = `Member ${shortenAddress(
        memberRemovedData.member.addr
      )} removed`;
      icon = (
        // Person with minus (remove member)
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="9" cy="7" r="4" strokeWidth="2" />
          <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" strokeWidth="2" />
          <path d="M22 11h-6" strokeWidth="2" />
        </svg>
      );
      break;
    case "MemberWeightUpdatedEvent":
      const memberWeightUpdatedData =
        event.data as typeof MemberWeightUpdatedEvent.$inferType;
      description = `Member ${shortenAddress(
        memberWeightUpdatedData.member.addr
      )} weight updated from ${memberWeightUpdatedData.oldWeight} to ${
        memberWeightUpdatedData.newWeight
      }`;
      icon = (
        // Dumbbell (weight update)
        <svg
          className="w-5 h-5 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="2" y="9" width="4" height="6" rx="1" fill="#fb923c" />
          <rect x="18" y="9" width="4" height="6" rx="1" fill="#fb923c" />
          <rect x="6" y="11" width="12" height="2" rx="1" fill="#fb923c" />
        </svg>
      );
      break;
    case "ThresholdChangedEvent":
      const thresholdChangedData =
        event.data as typeof ThresholdChangedEvent.$inferType;
      description = `Threshold changed from ${thresholdChangedData.oldThreshold} to ${thresholdChangedData.newThreshold}`;
      icon = (
        // Sliders (threshold/setting)
        <svg
          className="w-5 h-5 text-purple-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <line x1="4" y1="21" x2="4" y2="14" strokeWidth="2" />
          <line x1="4" y1="10" x2="4" y2="3" strokeWidth="2" />
          <line x1="12" y1="21" x2="12" y2="12" strokeWidth="2" />
          <line x1="12" y1="8" x2="12" y2="3" strokeWidth="2" />
          <line x1="20" y1="21" x2="20" y2="16" strokeWidth="2" />
          <line x1="20" y1="12" x2="20" y2="3" strokeWidth="2" />
          <circle cx="4" cy="12" r="2" fill="#a78bfa" />
          <circle cx="12" cy="8" r="2" fill="#a78bfa" />
          <circle cx="20" cy="16" r="2" fill="#a78bfa" />
        </svg>
      );
      break;
    case "GuardianChangedEvent":
      const guardianChangedData =
        event.data as typeof GuardianChangedEvent.$inferType;
      const oldGuardianBase64 = toBase64(
        new Uint8Array(guardianChangedData.oldGuardian)
      );
      const newGuardianBase64 = toBase64(
        new Uint8Array(guardianChangedData.newGuardian)
      );
      description = `Guardian changed from ${oldGuardianBase64} to ${newGuardianBase64}`;
      icon = (
        // Shield with check (guardian)
        <svg
          className="w-5 h-5 text-pink-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" />
          <path d="M9 12l2 2 4-4" stroke="#ec4899" strokeWidth="2" />
        </svg>
      );
      break;
    case "TransactionProposedEvent":
      const transactionProposedData =
        event.data as typeof TransactionProposedEvent.$inferType;
      const txDigestBase58 = toBase58(
        new Uint8Array(transactionProposedData.transactionDigest)
      );
      description = `Transaction ${txDigestBase58} proposed by ${transactionProposedData.proposer}`;
      icon = (
        // Paper plane (propose/send transaction)
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <polygon
            points="2 22 23 12 2 2 6 12 2 22"
            fill="#facc15"
          />
          <line
            x1="6"
            y1="12"
            x2="23"
            y2="12"
            stroke="#facc15"
            strokeWidth="2"
          />
        </svg>
      );
      break;
    case "TransactionApprovedEvent":
      const transactionApprovedData =
        event.data as typeof TransactionApprovedEvent.$inferType;
      const txDigestBase58Approved = toBase58(
        new Uint8Array(transactionApprovedData.transactionDigest)
      );
      description = `Transaction ${txDigestBase58Approved} approved by ${transactionApprovedData.approver}`;
      icon = (
        <svg
          className="w-5 h-5 text-teal-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <rect x="4" y="4" width="12" height="12" rx="3" />
        </svg>
      );
      break;
    case "TransactionApprovalThresholdReachedEvent":
        const txApprovalThresholdData = event.data as typeof TransactionApprovalThresholdReachedEvent.$inferType;
        const txDigestBase58Threshold = toBase58(
          new Uint8Array(txApprovalThresholdData.transactionDigest)
        );
        description = `Transaction ${txDigestBase58Threshold} reached approval threshold of ${txApprovalThresholdData.threshold}`;
        icon = (
          <svg
            className="w-5 h-5 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <rect x="4" y="4" width="12" height="12" rx="3" />
          </svg>
        );
        break;
    case "TransactionExecutedEvent":
        const transactionExecutedData = event.data as typeof TransactionExecutedEvent.$inferType;
        description = `Transaction ${transactionExecutedData.transactionDigest} executed`;
        icon = (
          <svg
            className="w-5 h-5 text-green-700"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <rect x="4" y="4" width="12" height="12" rx="3" />
          </svg>
        );
        break;
    case "TransactionRemovedEvent":
      const transactionRemovedData =
        event.data as typeof TransactionRemovedEvent.$inferType;
      const txDigestBase58Removed = toBase58(
        new Uint8Array(transactionRemovedData.transactionDigest)
      );
      description = `Transaction ${txDigestBase58Removed} removed`;
      icon = (
        <svg
          className="w-5 h-5 text-red-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <rect x="4" y="4" width="12" height="12" rx="3" />
        </svg>
      );
      break;
    default:
      description = `Unknown event`;
      icon = (
        <svg
          className="w-5 h-5 text-gray-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <circle cx="10" cy="10" r="8" />
        </svg>
      );
  }

  return (
    <div className="bg-background px-4 py-3 rounded-md border border-foreground/20 hover:border-foreground/40 transition">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-foreground/80">{description}</div>
          <div className="text-xs text-foreground/60 mt-1">
            {event.timestamp.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
