"use client";

import { useState } from "react";
import { Transactions } from "./Transactions";
import { Members } from "./Members";
import { Threshold } from "./Threshold";
import { AccountHistory } from "./AccountHistory";
import { generateAvatar } from "@/lib/utils/generateAvatar";

export function AccountOverView({isafeAccount}: {isafeAccount: string}) {
  const avatarUrl = generateAvatar(isafeAccount, 80);
  const [copied, setCopied] = useState(false);

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
    <div className="max-w-7xl mx-auto mt-8 space-y-6">
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
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Members Count */}
          <div className="bg-background/80 backdrop-blur rounded-lg p-5 border border-foreground/10 hover:border-foreground/20 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Members</h3>
            </div>
            <Members accountAddress={isafeAccount} compact={true} />
          </div>

          {/* Threshold */}
          <div className="bg-background/80 backdrop-blur rounded-lg p-5 border border-foreground/10 hover:border-foreground/20 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Threshold</h3>
            </div>
            <Threshold accountAddress={isafeAccount} compact={true} />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Transactions & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executed Transactions */}
        <Transactions accountAddress={isafeAccount} />
        
        {/* Account History */}
        <AccountHistory accountAddress={isafeAccount} />
      </div>
    </div>
  );
}
