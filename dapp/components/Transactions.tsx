"use client";

import { CONFIG } from "@/config";
import { useIotaClientQuery } from "@iota/dapp-kit";

interface TransactionsProps {
  accountAddress: string;
}

export function Transactions({ accountAddress }: TransactionsProps) {
  // Fetch transactions for the account
  const { data: txData, isLoading: isLoadingTx } = useIotaClientQuery(
    "queryTransactionBlocks",
    {
      filter: {
        FromAddress: accountAddress,
      },
      options: {
        showEffects: true,
        showInput: true,
      },
      limit: 10,
    },
    {
      enabled: !!accountAddress,
    }
  );

  const fallBackTxData = {
    data: [
      {
        digest: "gVxaqqc1nuS9NJuPYUaNfckRVVJSpVsEKFaMGo8osHG",
        timestampMs: "1696543200000",
        status: "Success",
      },
      {
        digest: "CQN3dbQtg56DdFFqNnLvk8wgTqomG2tYA94pLbXKByMp",
        timestampMs: "1696456800000",
        status: "Failure",
      },
    ],
  }

  return (
    <div className="bg-foreground/5 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Executed Transactions</h2>

      {/* TODO: Replace with real loading state when available */}
      {false ? (
        <p className="text-center text-foreground/60 py-8">
          Loading transactions...
        </p>
      ) : fallBackTxData && fallBackTxData.data.length > 0 ? (
        <div className="space-y-3">
          {/*  TODO: replace with real data when available */}
          {fallBackTxData.data.map((tx) => {
            const isSuccess = tx.status === "Success";
            return (
              <div
                key={tx.digest}
                className="bg-background px-4 py-3 rounded-md border border-foreground/20 hover:border-foreground/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Status Icon */}
                    {isSuccess ? (
                      <svg 
                        className="w-5 h-5 text-green-500 flex-shrink-0" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    ) : (
                      <svg 
                        className="w-5 h-5 text-red-500 flex-shrink-0" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm truncate text-foreground/80">
                        {tx.digest}
                      </p>
                      {tx.timestampMs && (
                        <p className="text-xs text-foreground/60 mt-1">
                          {new Date(parseInt(tx.timestampMs)).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={`https://explorer.iota.org/txblock/${tx.digest}?network=${CONFIG.network}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 px-3 py-1 bg-foreground/10 hover:bg-foreground/20 rounded-md text-sm font-medium transition flex-shrink-0"
                  >
                    View →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-foreground/60">
          <svg
            className="w-16 h-16 mx-auto mb-3 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>No transactions found for this account</p>
        </div>
      )}
    </div>
  );
}