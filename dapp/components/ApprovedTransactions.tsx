"use client";

import { TransactionSummary } from "@/hooks/useGetAccountTransactions";
import { shortenAddress } from "@/lib/utils/shortenAddress";
import { formatTimestamp } from "@/lib/utils/formatTimestamp";
import { ApprovalProgressBar } from "./ApprovalProgressBar";
import { useState } from "react";
import { ExecuteTransactionDialog } from "./dialogs/ExecuteTransactionDialog";

interface ApprovedTransactionsProps {
  transactions: TransactionSummary[];
}

export default function ApprovedTransactions({
  transactions,
}: ApprovedTransactionsProps) {
  const [executeTxDigestDialog, setExecuteTxDigestDialog] = useState<
    string | null
  >(null);
  const handleExecute = async (txDigest: string) => {
    setExecuteTxDigestDialog(txDigest);
  };

  return (
    <>
      <div className="bg-foreground/5 rounded-xl p-6 border border-foreground/10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Approved Transactions
        </h2>

        <div className="mb-4 text-sm text-foreground/60">
          {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""} ready for execution
        </div>

        {transactions.length === 0 ? (
          /* Empty state */
          <div className="bg-background rounded-lg border border-foreground/10 p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-foreground/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-3 text-sm font-medium text-foreground/80">
              No approved transactions
            </h3>
            <p className="mt-1 text-sm text-foreground/50">
              There are no transactions ready for execution.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.transactionDigest}
                className="bg-background rounded-lg border border-foreground/10 p-4 hover:border-foreground/20 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-mono text-sm text-foreground">
                        {shortenAddress(tx.transactionDigest)}
                      </p>
                      <p className="text-sm text-foreground/60">
                        Proposed by {shortenAddress(tx.proposerAddress)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground/50">
                      {formatTimestamp(tx.createdAt)}
                    </span>
                    <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-medium">
                      {tx.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <ApprovalProgressBar
                    currentApprovals={tx.currentApprovals}
                    threshold={tx.threshold}
                    totalAccountWeight={tx.totalAccountWeight}
                  />
                </div>

                {/* Execute Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleExecute(tx.transactionDigest)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                  >
                    Execute
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {executeTxDigestDialog && (
        <ExecuteTransactionDialog
          transactionDigest={executeTxDigestDialog}
          closeDialog={() => setExecuteTxDigestDialog(null)}
          onCompleted={() => setExecuteTxDigestDialog(null)}
        />
      )}
    </>
  );
}
