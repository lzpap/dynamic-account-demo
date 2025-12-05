"use client";

export default function ExecutedTransactions() {
  return (
    <div className="bg-foreground/5 rounded-xl p-6 border border-foreground/10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Executed Transactions
      </h2>

      <div className="mb-4 text-sm text-foreground/60">
        Transaction history
      </div>

      {/* Empty state */}
      <div className="bg-background rounded-lg border border-foreground/10 p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-foreground/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="mt-3 text-sm font-medium text-foreground/80">No executed transactions</h3>
        <p className="mt-1 text-sm text-foreground/50">
          Transaction history will appear here once transactions are executed.
        </p>
      </div>

      {/* Example transaction item structure (commented for reference)
      <div className="space-y-3">
        <div className="bg-background rounded-lg border border-foreground/10 p-4 hover:border-foreground/20 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Transaction Title</p>
                <p className="text-sm text-foreground/60">Executed on Dec 5, 2025</p>
              </div>
            </div>
            <div className="text-right">
              <a 
                href="#" 
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}
