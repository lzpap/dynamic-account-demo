"use client";
import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { SettingsAction } from "@/app/[account]/settings/page";
import { isValidIotaAddress, toBase64 } from "@iota/iota-sdk/utils";
import { CONFIG } from "@/config/config";
import { ObjectRef, Transaction } from "@iota/iota-sdk/transactions";
import { useIotaClient } from "@iota/dapp-kit";
import { fromBase58 } from "@iota/iota-sdk/utils";
import { bcs } from "@iota/iota-sdk/bcs";
import { uploadTx } from "@/lib/utils/uploadTx";
import { queryKey } from "@/hooks/queryKey";
import { useSignAndExecuteTransaction } from "@iota/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";

interface ExecuteSettingChangesDialogProps {
  action: SettingsAction;
  accountAddress: string;
  onClose: () => void;
  // Optionally, you can pass settings change params here
}

const GAS_BUDGET = 1000000;

export function ExecuteSettingChangesDialog({
  action,
  accountAddress,
  onClose,
}: ExecuteSettingChangesDialogProps) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [proposedTxDigest, setProposedTxDigest] = useState<string | null>(null);
  const iotaClient = useIotaClient();
  const { mutate: signAndExecuteTransaction, isPending } =
    useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  async function prepareSettingsChange(): Promise<Transaction> {
    const tx = new Transaction();
    const PACKAGE_ID = CONFIG.packageId;

    switch (action.type) {
      case "add_member":
        if (!isValidIotaAddress(action.address)) {
          throw new Error("Invalid IOTA address");
        }
        if (action.weight <= 0) {
          throw new Error("Weight must be a positive number");
        }
        tx.moveCall({
          target: `${PACKAGE_ID}::dynamic_auth::add_member`,
          arguments: [
            tx.object(accountAddress),
            tx.pure.address(action.address),
            tx.pure.u64(action.weight),
          ],
        });
        break;

      case "remove_member":
        if (!isValidIotaAddress(action.address)) {
          throw new Error("Invalid IOTA address");
        }
        tx.moveCall({
          target: `${PACKAGE_ID}::dynamic_auth::remove_member`,
          arguments: [
            tx.object(accountAddress),
            tx.pure.address(action.address),
          ],
        });
        break;

      case "update_weight":
        if (!isValidIotaAddress(action.address)) {
          throw new Error("Invalid IOTA address");
        }
        if (action.newWeight <= 0) {
          throw new Error("Weight must be a positive number");
        }
        tx.moveCall({
          target: `${PACKAGE_ID}::dynamic_auth::update_member_weight`,
          arguments: [
            tx.object(accountAddress),
            tx.pure.address(action.address),
            tx.pure.u64(action.newWeight),
          ],
        });
        break;

      case "set_threshold":
        if (action.newThreshold <= 0) {
          setError("Threshold must be a positive number");
          throw new Error("Threshold must be a positive number");
        }
        tx.moveCall({
          target: `${PACKAGE_ID}::dynamic_auth::set_threshold`,
          arguments: [
            tx.object(accountAddress),
            tx.pure.u64(action.newThreshold),
          ],
        });
        break;
    }

    // TODO: Simulate to estimate gas?
    const gasBudget = GAS_BUDGET;
    tx.setSender(accountAddress);
    tx.setGasOwner(accountAddress);
    tx.setGasBudget(gasBudget);
    const referenceGasPrice = await iotaClient.getReferenceGasPrice();
    tx.setGasPrice(referenceGasPrice);
    return tx;
  }

  async function selectGas(tx: Transaction): Promise<Transaction> {
    let gasBalance = 0;
    const coinResponse = await iotaClient.getCoins({ owner: accountAddress });
    let i = 0;
    const payments: ObjectRef[] = [];
    while (gasBalance < GAS_BUDGET && i < coinResponse.data.length) {
      payments.push({
        objectId: coinResponse.data[i].coinObjectId,
        version: coinResponse.data[i].version,
        digest: coinResponse.data[i].digest,
      });
      gasBalance += Number(coinResponse.data[i].balance);
      i++;
    }
    if (gasBalance < GAS_BUDGET) {
      throw new Error("Insufficient balance to cover gas budget");
    }
    tx.setGasPayment(payments);
    return tx;
  }

  async function proposeSettingsChange(tx: Transaction): Promise<string> {
    const toBeProposedTxBytes = await tx.build({ client: iotaClient });

    const toBeProposedTxDigest = await tx.getDigest();

    const proposingTx = new Transaction();

    proposingTx.moveCall({
      target: `${CONFIG.packageId}::dynamic_auth::propose_transaction`,
      arguments: [
        proposingTx.object(accountAddress),
        proposingTx.pure(
          bcs.vector(bcs.u8()).serialize(fromBase58(toBeProposedTxDigest))
        ),
      ],
    });

    signAndExecuteTransaction(
      { transaction: proposingTx, waitForTransaction: true },
      {
        onSuccess: async (result) => {
          const uploadTxResult = await uploadTx(
            toBase64(toBeProposedTxBytes),
            `Proposed transaction for action: ${action.type}`
          );
          if (uploadTxResult.error) {
            throw new Error(
              "Failed to upload transaction to service: " + uploadTxResult.error
            );
          }
          // we just proposed a transaction that can change the account state, so we need to invalidate related queries
          queryClient.invalidateQueries({ queryKey: queryKey.transactions(accountAddress) });
          setStep(4); // 4a. Success
        setSuccess(true);
          return toBeProposedTxDigest;
        },
        onError: (err) => {
          throw new Error(`Transaction failed: ${err.message}`);
        },
      }
    );
    return toBeProposedTxDigest;
  }

  useEffect(() => {
    let cancelled = false;
    async function runSteps() {
      setStep(1); // 1. Preparing settings change transaction
      try {
        // Simulate async step 1
        const tx = await prepareSettingsChange();
        if (cancelled) return;
        setStep(2); // 2. Selecting gas
        const finalTx = await selectGas(tx);
        if (cancelled) return;
        setStep(3); // 3. Proposing setting change
        const proposedTxDigest = await proposeSettingsChange(finalTx);
        setProposedTxDigest(proposedTxDigest);
        if (cancelled) return;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStep(5); // 4b. Failure
      }
    }
    runSteps();
    return () => {
      cancelled = true;
    };
  }, []);

  const steps = [
    "Preparing settings change transaction...",
    "Selecting gas...",
    "Proposing setting change...",
    "Success!",
    "Couldn't carry out settings change",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-background border border-foreground/20 rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-foreground/10">
          <h2 className="text-xl font-semibold">Execute Setting Changes</h2>
        </div>
        <div className="p-6 space-y-6">
          <ol className="space-y-3">
            {steps
              .slice(0, success ? 4 : error ? 5 : step)
              .map((label, idx) => (
                <li
                  key={label}
                  className={
                    idx + 1 < step
                      ? "text-green-600"
                      : idx + 1 === step
                      ? "font-semibold text-blue-600"
                      : "text-foreground/60"
                  }
                >
                  {label}
                  {idx + 1 === step && !error && !success && (
                    <span className="ml-2 animate-spin inline-block align-middle">
                      <svg
                        className="w-4 h-4 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                  )}
                </li>
              ))}
          </ol>

          {success && proposedTxDigest && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <span className="text-green-600 font-semibold">
                Proposed setting change successfully with digest {proposedTxDigest}!
              </span>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={() => redirect(`/${accountAddress}/transactions`)}
                >
                  Go to Proposed Transactions
                </button>
                <button
                  className="px-4 py-2 bg-foreground/10 text-foreground rounded hover:bg-foreground/20 transition"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-6 text-red-600 font-semibold">
              Ooops, something went wrong: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
