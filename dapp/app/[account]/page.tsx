'use client';

import { AccountOverView } from "@/components/AccountOverView";
import { useParams } from 'next/navigation';
    import { notFound } from 'next/navigation';

// TODO query the existence of the account on chain
// Mock data: Maps account IDs to their existence status
const validAccounts: Record<string, boolean> = {
  "0x799e53ed6e11430ee67cfbd2d8d81ccd89757f94544956f97049e9088657f71b": true,
  "0x1234567890abcdef1234567890abcdef12345678": true,
  "0xabcdef1234567890abcdef1234567890abcdef12": true,
};

export default function AccountHome( ) {
  const params = useParams();
  const accountId = params.account as string;

  // Check if account exists in mock data
  const accountExists = validAccounts[accountId] === true;

  if (!accountExists) {
    notFound();
  }
  
  return (
        <main className="flex flex-col min-h-screen ml-64">
            <h1 className="text-4xl font-bold text-center mt-10">Welcome to iSafe</h1>
            <AccountOverView />
        </main>
  );
}
