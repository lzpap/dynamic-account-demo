"use client";

import { useState } from "react";
import Transactions from "./Transactions";
import { Members } from "./Members";
import { Threshold } from "./Threshold";
import { AccountActivity } from "./AccountActivity";
import { generateAvatar } from "@/lib/utils/generateAvatar";
import { AccountBalance } from "./AccountBalance";
import { SendIotaDialog } from "./dialogs/SendIotaDialog";
import { useGetAccountBalance } from "@/hooks/useGetAccountBalance";

export function AccountOverView({ isafeAccount }: { isafeAccount: string }) {
  const avatarUrl = generateAvatar(isafeAccount, 80);
  const [copied, setCopied] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const { data: balance } = useGetAccountBalance(isafeAccount);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isafeAccount);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // if (!isafeAccount) {
  //   return (
  //     <div className="max-w-4xl mx-auto mt-8 p-6 bg-foreground/5 rounded-lg">
  //       <p className="text-center text-foreground/60">
  //         No account selected. Please select an account from the navbar.
  //       </p>
  //     </div>
  //   );
  // }

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-6">
      {/* Account Overview - Single Row Layout */}
      <div className="bg-gradient-to-br from-foreground/5 to-foreground/10 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Account Avatar"
            className="w-16 h-16 rounded-full shadow-md"
          />
          <p className="font-mono text-xl break-all leading-relaxed">{isafeAccount}</p>
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-foreground/10 rounded-md transition-colors flex-shrink-0"
            title={copied ? "Copied!" : "Copy address"}
          >
            {copied ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <div className="relative group flex-shrink-0">
            <button
              onClick={() => setShowSendDialog(true)}
              className="p-2 hover:bg-foreground/10 rounded-md transition-colors"
              aria-label="Send funds from this account"
              title="Send funds from this account"
            >
              <svg
                className="w-5 h-5 text-foreground/60 rotate-45"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>

            <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Send funds from this account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[22rem_48rem] lg:justify-center gap-6">
          {/* Compact account summary */}
          <div className="bg-background/80 backdrop-blur rounded-lg border border-foreground/10 hover:border-foreground/20 transition-all hover:shadow-md">
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                Summary
              </h3>
            </div>
            <div className="px-5 pb-5">
              <div className="divide-y divide-foreground/10 rounded-md">
                <div className="py-3">
                  <AccountBalance accountAddress={isafeAccount} compact />
                </div>
                <div className="py-3">
                  <Members accountAddress={isafeAccount} compact={true} />
                </div>
                <div className="py-3">
                  <Threshold accountAddress={isafeAccount} compact={true} />
                </div>
              </div>
            </div>
          </div>

          {/* Account Activity */}
          <div>
            <AccountActivity accountAddress={isafeAccount} />
          </div>
        </div>
      </div>

      {/* Full-width transactions */}
      <Transactions accountAddress={isafeAccount} />

      {/* Send IOTA Dialog */}
      {showSendDialog && balance && (
        <SendIotaDialog
          accountAddress={isafeAccount}
          accountBalance={balance.totalBalance}
          onClose={() => setShowSendDialog(false)}
        />
      )}
    </div>
  );
}
