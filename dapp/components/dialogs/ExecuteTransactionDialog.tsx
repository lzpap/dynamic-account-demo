"use client";
import { useState, useEffect } from "react";
import { useIotaClient } from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { fromBase64 } from "@iota/iota-sdk/utils";

interface ExecuteTransactionDialogProps {
  transactionDigest: string;
  closeDialog: () => void;
  onCompleted?: () => void;
}

export function ExecuteTransactionDialog({
  transactionDigest,
  closeDialog,
  onCompleted,
}: ExecuteTransactionDialogProps) {
  const [txBytes, setTxBytes] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [simulationPassed, setSimulationPassed] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [executeSuccess, setExecuteSuccess] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const client = useIotaClient();

  // Fetch transaction bytes on mount
  useEffect(() => {
    const runSimulation = async (bytes: string) => {
      setIsSimulating(true);
      setSimulationError(null);

      try {
        await client.dryRunTransactionBlock({
          transactionBlock: bytes,
        });

        setSimulationPassed(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSimulationError(`Simulation failed: ${message}`);
        setSimulationPassed(false);
      } finally {
        setIsSimulating(false);
      }
    };

    const fetchTransactionBytes = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(
          `http://127.0.0.1:3031/transaction/${transactionDigest}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch transaction: ${response.statusText}`
          );
        }

        const data = await response.json();
        const bytes = data.bcs;
        const decodedBytes = fromBase64(bytes);
        const tx = Transaction.from(decodedBytes).getData();

        // TODO: The signature we can craft ourselves if we have support for the new auth variant in the SDK
        // instead we fetch it from the tx-service now as that can provide the correct signature
        const sigResponse = await fetch(
          `http://127.0.0.1:3031/derive_auth_signature/${tx.sender}`
        );

        if (!sigResponse.ok) {
          throw new Error(
            `Failed to fetch move authenticator signature field: ${sigResponse.statusText}`
          );
        }

        const sigData = await sigResponse.json();
        const sig = sigData.signature;

        if (!bytes) {
          throw new Error("Transaction bytes not found");
        }

        if (!sig) {
          throw new Error("Transaction signature not found");
        }

        setTxBytes(bytes);
        setSignature(sig);

        // Automatically run simulation
        await runSimulation(bytes);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionBytes();
  }, [transactionDigest, client]);

  const handleExecute = async () => {
    if (!txBytes || !signature) return;

    setIsExecuting(true);
    setExecuteError(null);

    try {
      const result = await client.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: signature,
        options: {
          showEffects: true,
        },
      });

      setExecuteSuccess(true);
      setExecutionResult(result.digest);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setExecuteError(`Failed to execute transaction: ${message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeDialog}
      />

      {/* Dialog */}
      <div className="relative bg-background border border-foreground/20 rounded-xl shadow-2xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-foreground/10">
          <h2 className="text-xl font-semibold">Execute Transaction</h2>
          <button
            onClick={closeDialog}
            className="p-2 hover:bg-foreground/10 rounded-md transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {executeSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
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
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Transaction Executed!
              </h3>
              <p className="text-sm text-foreground/60 text-center mb-2">
                The transaction has been successfully executed on the network.
              </p>
              {executionResult && (
                <p className="text-xs font-mono text-foreground/50 bg-foreground/5 px-3 py-2 rounded-lg mb-6">
                  Digest: {executionResult}
                </p>
              )}
              <button
                onClick={closeDialog}
                className="px-6 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition"
              >
                Close
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg
                className="w-8 h-8 animate-spin text-foreground/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <p className="mt-4 text-sm text-foreground/60">
                Loading transaction...
              </p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Failed to Load Transaction
              </h3>
              <p className="text-sm text-red-500 text-center mb-6">
                {loadError}
              </p>
              <button
                onClick={closeDialog}
                className="px-6 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Transaction Digest
                </label>
                <p className="font-mono text-sm bg-foreground/5 border border-foreground/20 rounded-lg px-4 py-3">
                  {transactionDigest}
                </p>
              </div>

              {/* Simulation Status */}
              {isSimulating && (
                <div className="flex items-center gap-2 p-3 bg-foreground/5 border border-foreground/20 rounded-lg">
                  <svg
                    className="w-5 h-5 animate-spin text-foreground/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <p className="text-sm text-foreground/60">
                    Simulating transaction...
                  </p>
                </div>
              )}

              {simulationError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-500">{simulationError}</p>
                </div>
              )}

              {simulationPassed && (
                <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
                  <p className="text-sm text-green-500">
                    Simulation passed - transaction is ready to execute
                  </p>
                </div>
              )}

              {executeError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-500">{executeError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!executeSuccess && !isLoading && !loadError && (
          <div className="flex justify-end gap-3 p-6 border-t border-foreground/10">
            <button
              onClick={closeDialog}
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-foreground/10 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={!simulationPassed || isExecuting}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Executing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Execute
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
