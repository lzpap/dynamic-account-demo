'use client';

import { queryKey, useGetAccountsForAddress } from "@/hooks";
import { useISafeAccount } from "@/providers/ISafeAccountProvider";
import { Button } from "@iota/apps-ui-kit";
import { useAccounts, useCurrentAccount, useCurrentWallet } from "@iota/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { redirect, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

// TODO: query backend indexer for address -> account mapping
const addressToAccountMap: Record<string, string[]> = {
    "0x7f5ef659f341e3256d4abd256c66f754fcf78bf574034f5d5ae8d11e55207d20": ["0x799e53ed6e11430ee67cfbd2d8d81ccd89757f94544956f97049e9088657f71b"],
    "0xdef456": ["account2"],
};

export function AccountSelector(){
    const {isafeAccount, toggleAccount } = useISafeAccount();
    const { currentWallet, connectionStatus } = useCurrentWallet();
    const selectedWalletAccount = useCurrentAccount();
    const { data: accounts } = useGetAccountsForAddress(selectedWalletAccount?.address || "");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const pathname = usePathname();

    const handleAccountCreationClick = () => {
        redirect('/create');
    };

    // Clear iSafe account selection when wallet account changes
    useEffect(() => {
        if (isafeAccount) {
            toggleAccount('');
            redirect('/');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWalletAccount?.address]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (connectionStatus !== 'connected' || !currentWallet || !selectedWalletAccount) {
        return (
            <button className="w-full px-4 py-2 bg-foreground/10 text-foreground rounded-full text-sm font-medium hover:bg-foreground/20 transition">
                Connect Wallet First
            </button>
        );
    }

    // wallet is connected here
    // if there doesn't exist iSafe accounts for the wallet, prompt the user to create one

    if (!accounts) {
        return (
            <button
                className="w-full px-4 py-2 bg-foreground/10 text-foreground rounded-full text-sm font-medium hover:bg-foreground/20 transition"
                onClick={handleAccountCreationClick}
            >
                Create iSafe Account
            </button>
        );
    }

    // when there is at least one iSafe account mapped, prompt the user to select one
    console.log("Mapped Accounts:", accounts);

    return (
        <div ref={dropdownRef} className="relative w-full">
            <button
                onClick={() => {
                    queryClient.invalidateQueries({ queryKey: queryKey.member_accounts(selectedWalletAccount.address) });
                    setIsOpen(!isOpen)
                }}
                className={`w-full px-4 py-2 rounded-full text-sm font-medium transition flex items-center justify-between ${
                    isafeAccount 
                        ? 'bg-foreground text-background hover:bg-foreground/90' 
                        : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
                }`}
            >
                <span className="truncate">
                    {isafeAccount 
                        ? `${isafeAccount.substring(0, 6)}...${isafeAccount.substring(isafeAccount.length - 4)}`
                        : 'Select Account'}
                </span>
                <svg
                    className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-foreground/20 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {/* Reset Option */}
                    {isafeAccount && (
                        <button
                            onClick={() => {
                                toggleAccount('');
                                setIsOpen(false);
                                redirect('/');
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-foreground/5 transition border-b border-foreground/10 first:rounded-t-lg text-red-500 hover:bg-red-500/5"
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Clear Selection</span>
                            </div>
                        </button>
                    )}
                    
                    {accounts.map((account, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                const prevAccount = isafeAccount;
                                toggleAccount(account);
                                setIsOpen(false);
                                if (prevAccount && pathname.includes(prevAccount)) {
                                    redirect(pathname.replace(prevAccount, account));
                                } else {
                                    redirect(`/${account}`);
                                }
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-foreground/5 transition ${
                                !isafeAccount && index === 0 ? 'first:rounded-t-lg' : ''
                            } ${
                                isafeAccount === account
                                    ? 'bg-foreground/10 font-medium'
                                    : ''
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="truncate font-mono text-xs">
                                    {account.substring(0, 8)}...{account.substring(account.length - 6)}
                                </span>
                                {isafeAccount === account && (
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </button>
                    ))}
                    
                    {/* Create New Account Option - Always visible */}
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            redirect('/create');
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-foreground/5 transition border-t border-foreground/10 last:rounded-b-lg text-blue-500 hover:bg-blue-500/5"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Create New Account</span>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}