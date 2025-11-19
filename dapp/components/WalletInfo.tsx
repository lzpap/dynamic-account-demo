"use client";

import { useCurrentWallet } from "@iota/dapp-kit";
import Image from "next/image";

export function WalletInfo() {
  const { currentWallet, connectionStatus } = useCurrentWallet();
  console.log("Current Wallet:", currentWallet);
  return <div>
    <h2 className="text-2xl font-semibold mb-4">Wallet Information</h2>
    {connectionStatus === 'connected' && currentWallet ? (
      <div>
        <p className="mb-2"><strong>Connected Accounts:</strong></p>
        <ul className="space-y-2">
          {currentWallet.accounts.map((account, index) => (
            <li key={account.address} className="pl-4 flex items-center gap-2">
              {account.icon && (
                <Image 
                  src={currentWallet.icon} 
                  alt={`${account.label} icon`}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="font-medium">{account.label}</span>
              <span className="mx-2">·</span>
              <span className="font-mono text-sm">{account.address}</span>
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <p>No wallet connected.</p>
    )}
  </div>;
}
