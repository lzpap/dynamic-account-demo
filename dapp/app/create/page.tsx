"use client";

import { useState } from "react";
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
} from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { CONFIG } from "@/config/config";
import { TransactionEffects } from "@iota/iota-sdk/client";
import { fromBase64 } from "@iota/iota-sdk/utils";
import { bcs } from "@iota/iota-sdk/bcs";
import { redirect } from "next/navigation";
import { useISafeAccount } from "@/providers/ISafeAccountProvider";
import { normalizeIotaAddress, isValidIotaAddress } from "@iota/iota-sdk/utils";

interface Member {
  address: string;
  weight: string; // Keep as string for input control
}

interface AccountCreatedEvent {
  account: string;
}

export default function Create() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending } =
    useSignAndExecuteTransaction();
  const client = useIotaClient();
  const { isafeAccount, toggleAccount } = useISafeAccount();

  const [members, setMembers] = useState<Member[]>([
    { address: currentAccount?.address || "", weight: "1" },
  ]);
  const [threshold, setThreshold] = useState<string>("1");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const addMember = () => {
    setMembers([...members, { address: "", weight: "1" }]);
  };

  const addCurrentWallet = () => {
    if (
      currentAccount?.address &&
      !members.some((m) => m.address === currentAccount.address)
    ) {
      setMembers([
        ...members,
        { address: currentAccount.address, weight: "1" },
      ]);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMemberAddress = (index: number, address: string) => {
    const newMembers = [...members];
    newMembers[index].address = address;
    setMembers(newMembers);
  };

  const updateMemberWeight = (index: number, weight: string) => {
    const newMembers = [...members];
    newMembers[index].weight = weight;
    setMembers(newMembers);
  };

  // Validation functions
  const validateForm = (): { valid: boolean; error: string } => {
    // Check if all addresses are filled and valid
    for (const member of members) {
      if (!member.address.trim()) {
        return { valid: false, error: "All member addresses must be filled" };
      }
      if (!isValidIotaAddress(member.address)) {
        return {
          valid: false,
          error: `Invalid IOTA address: ${member.address}`,
        };
      }
    }

    // Check for duplicate addresses
    const addresses = members.map((m) => m.address);
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      return { valid: false, error: "Duplicate addresses are not allowed" };
    }

    // Check if all weights are valid positive numbers
    for (const member of members) {
      const weight = parseInt(member.weight, 10);
      if (isNaN(weight) || weight <= 0) {
        return {
          valid: false,
          error: "All member weights must be positive numbers",
        };
      }
    }

    // Calculate total weight
    const totalWeight = members.reduce(
      (sum, m) => sum + parseInt(m.weight, 10),
      0
    );

    // Check threshold validity
    const thresholdNum = parseInt(threshold, 10);
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      return { valid: false, error: "Threshold must be a positive number" };
    }
    if (thresholdNum > totalWeight) {
      return {
        valid: false,
        error: `Threshold (${thresholdNum}) cannot exceed total weight (${totalWeight})`,
      };
    }

    return { valid: true, error: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    const validation = validateForm();
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (!currentAccount?.address) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      // Create the transaction
      const tx = new Transaction();

      // TODO: Replace with your actual package ID after publishing
      const PACKAGE_ID = CONFIG.packageId; // Replace with your deployed package ID
      const PACKAGE_METADATA_ID = CONFIG.packageMetadataId;

      // Build the account using setup_account or create_account_builder pattern
      // For simplicity, using a direct move call approach
      const memberAddresses = members.map((m) => m.address);
      const memberWeights = members.map((m) => parseInt(m.weight, 10));

      // Call the move function to create account
      // This assumes you have a public entry function that wraps build_and_publish
      tx.moveCall({
        target: `${PACKAGE_ID}::dynamic_auth::create_account`,
        arguments: [
          tx.pure.vector("address", memberAddresses),
          tx.pure.vector("u64", memberWeights),
          tx.pure.u64(parseInt(threshold, 10)),
          tx.object(PACKAGE_METADATA_ID),
        ],
      });

      // Sign and execute the transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
          waitForTransaction: true,
        },
        {
          onSuccess: async (result) => {

            const transactionEffects = bcs.TransactionEffects.parse(
              new Uint8Array(Buffer.from(result.effects, "base64"))
            );
            // TODO: Extract the created account address from the effects, redirect to the account page
            console.log("Transaction Effects:", transactionEffects);

            const eventQueryResult = await client.queryEvents({
                query: {
                    Transaction: transactionEffects.V1.transactionDigest,
                }
            });

            const event: AccountCreatedEvent = eventQueryResult.data[0]?.parsedJson as AccountCreatedEvent;

            setSuccess(
              `Account created successfully! Digest: ${result.digest}`
            );
            // Reset form
            setMembers([
              { address: currentAccount?.address || "", weight: "1" },
            ]);
            setThreshold("1");
            toggleAccount(event.account);
            redirect(`/${event.account}`);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            setError(`Transaction failed: ${error.message}`);
          },
        }
      );
    } catch (err: any) {
      setError(`Error preparing transaction: ${err.message}`);
    }
  };

  const validation = validateForm();
  const totalWeight = members.reduce((sum, m) => {
    const weight = parseInt(m.weight, 10);
    return sum + (isNaN(weight) ? 0 : weight);
  }, 0);

  return (
    <main className="flex flex-col min-h-screen ml-64 p-8">
      <h1 className="text-4xl font-bold text-center mt-10 mb-8">
        Create A New iSafe Account
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto w-full bg-foreground/5 rounded-lg shadow-md p-6"
      >
        {/* Members Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-foreground font-semibold text-lg">
              Members
            </label>
            <button
              type="button"
              onClick={addCurrentWallet}
              disabled={!currentAccount?.address}
              className="px-3 py-1 text-sm bg-foreground/10 text-foreground font-semibold rounded-md hover:bg-foreground/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add My Wallet
            </button>
          </div>

          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={member.address}
                    onChange={(e) => updateMemberAddress(index, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 font-mono text-sm ${
                      member.address && !isValidIotaAddress(member.address)
                        ? "border-red-500 focus:ring-red-500"
                        : "border-foreground/20 focus:ring-foreground/50"
                    }`}
                    placeholder="0x..."
                  />
                  <input
                    type="number"
                    min="1"
                    value={member.weight}
                    onChange={(e) => updateMemberWeight(index, e.target.value)}
                    className="w-32 px-3 py-2 border border-foreground/20 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-foreground/50"
                    placeholder="Weight"
                  />
                </div>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition mt-0"
                    title="Remove member"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMember}
            className="mt-3 px-4 py-2 bg-foreground/10 text-foreground font-semibold rounded-md hover:bg-foreground/20 transition"
          >
            + Add Member
          </button>

          <p className="mt-2 text-sm text-foreground/60">
            Total Weight: <span className="font-semibold">{totalWeight}</span>
          </p>
        </div>

        {/* Threshold Section */}
        <div className="mb-6">
          <label
            htmlFor="threshold"
            className="block text-foreground font-semibold text-lg mb-2"
          >
            Threshold
          </label>
          <input
            type="number"
            id="threshold"
            min="1"
            max={totalWeight}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full px-3 py-2 border border-foreground/20 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-foreground/50"
            placeholder="e.g., 2"
          />
          <p className="mt-1 text-sm text-foreground/60">
            Minimum combined weight required to approve transactions
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-green-500 text-sm">{success}</p>
          </div>
        )}

        {/* Validation Summary */}
        {!validation.valid && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
            <p className="text-yellow-600 text-sm">{validation.error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!validation.valid || isPending}
          className="w-full bg-foreground text-background font-semibold py-3 px-4 rounded-md hover:bg-foreground/90 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      {/* Info Section */}
      <div className="max-w-2xl mx-auto w-full mt-6 p-4 bg-foreground/5 rounded-lg">
        <h2 className="font-semibold mb-2">What is an iSafe Account?</h2>
        <ul className="text-sm text-foreground/80 space-y-1 list-disc list-inside">
          <li>Multi-signature account controlled by multiple members</li>
          <li>Each member has a weight that determines their voting power</li>
          <li>
            Transactions require approval from members whose combined weight
            meets the threshold
          </li>
          <li>Members can be added or removed through approved transactions</li>
        </ul>
      </div>
    </main>
  );
}
