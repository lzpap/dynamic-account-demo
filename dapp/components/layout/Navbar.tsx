'use client';

import { ConnectButton } from '@iota/dapp-kit';
import Link from 'next/link';
import { AccountSelector } from '@/components/AccountSelector';
import { useISafeAccount } from '@/providers/ISafeAccountProvider';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export function Navbar() {
    const {isafeAccount } = useISafeAccount();
    const pathname = usePathname();
    return (
        <nav id="top-navbar" className="fixed top-0 left-0 h-full z-50 backdrop-blur-lg bg-foreground/5 flex flex-col items-center p-4 w-64">
            <div className="w-full mb-6">
                <ConnectButton connectText="Connect Wallet" className="w-full" />
            </div>
            <div className="w-full mb-6">
                <AccountSelector />
            </div>
            {isafeAccount && (
                <div className="w-full flex flex-col gap-2">
                    <Link 
                        href="/" 
                        className={clsx(
                            'text-lg font-semibold transition px-3 py-2 rounded-md',
                            pathname === '/' 
                                ? 'bg-foreground text-background' 
                                : 'hover:bg-foreground/10'
                        )}
                    >
                        Home
                    </Link>
                    <Link 
                        href={`/${isafeAccount}`} 
                        className={clsx(
                            'text-lg font-semibold transition px-3 py-2 rounded-md',
                            pathname === `/${isafeAccount}` 
                                ? 'bg-foreground text-background' 
                                : 'hover:bg-foreground/10'
                        )}
                    >
                        My Account
                    </Link>
                    <Link 
                        href={`/${isafeAccount}/settings`} 
                        className={clsx(
                            'text-lg font-semibold transition px-3 py-2 rounded-md',
                            pathname === `/${isafeAccount}/settings` 
                                ? 'bg-foreground text-background' 
                                : 'hover:bg-foreground/10'
                        )}
                    >
                        Settings
                    </Link>
                    <Link 
                        href={`/${isafeAccount}/transactions`} 
                        className={clsx(
                            'text-lg font-semibold transition px-3 py-2 rounded-md',
                            pathname === `/${isafeAccount}/transactions` 
                                ? 'bg-foreground text-background' 
                                : 'hover:bg-foreground/10'
                        )}
                    >
                        Transactions
                    </Link>
                    <Link 
                        href="/create" 
                        className={clsx(
                            'text-lg font-semibold transition px-3 py-2 rounded-md',
                            pathname === '/create' 
                                ? 'bg-foreground text-background' 
                                : 'hover:bg-foreground/10'
                        )}
                    >
                        Create
                    </Link>
                </div>
            )}

        </nav>
    );
}