'use client';

import { ConnectButton } from '@iota/dapp-kit';
import Link from 'next/link';

export function Navbar() {
    return (
        <nav id="top-navbar" className="fixed top-0 left-0 h-full z-50 backdrop-blur-lg bg-foreground/5 flex flex-col items-center p-4 w-64">
            <div className="w-full mb-6">
                <ConnectButton connectText="Connect Wallet" className="w-full" />
            </div>
            <Link href="/" className="mb-4 text-lg font-semibold">Home</Link>
        </nav>
    );
}