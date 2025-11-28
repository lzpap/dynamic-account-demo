'use client';

import { AccountOverView } from "@/components/AccountOverView";
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useGetAccountObject } from "@/hooks";

export default function AccountHome( ) {
  const params = useParams();
  const accountId = params.account as string;

  const { data: accountObject, isPending: isPendingAccount, isError: isFetchError, error } = useGetAccountObject(accountId);

  // Check if account doesn't exist after loading completes
  if (error) {
    notFound();
  }

  console.log("Account object fetch error status:", isFetchError);

  return (
        <main className="flex flex-col min-h-screen ml-64">
            {isPendingAccount ? (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  {/* Magnifying glass icon with animation */}
                  <div className="relative inline-block mb-6">
                    <svg 
                      className="w-24 h-24 text-foreground/40 animate-pulse" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                      />
                    </svg>
                    {/* Animated searching dots */}
                    <div className="absolute -right-2 -bottom-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground/80 mb-2">
                    Looking for your account...
                  </h2>
                  <p className="text-foreground/60">Where did I put it? 🤔</p>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-center mt-10">Welcome to iSafe</h1>
                <AccountOverView isafeAccount={accountId} />
              </>
            )}
        </main>
  );
}
