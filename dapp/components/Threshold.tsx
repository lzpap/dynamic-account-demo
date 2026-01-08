'use client';

import { useGetThreshold } from '@/hooks/useGetThreshold';

interface ThresholdProps {
  accountAddress: string;
  compact?: boolean;
}

export function Threshold({ accountAddress, compact = false }: ThresholdProps) {
    // hint: can call the view function threshold() from the iSafe smart contract with the address
    // can call total_weight() similarl

      const { threshold, totalWeight, error, isLoading } = useGetThreshold(accountAddress);
    
      if (isLoading) {
        return <div>Loading threshold...</div>;
      }
    
      if (error || (!threshold && !isLoading)) {
        return <div>Error loading threshold: {error?.message}</div>;
      }

    if (compact) {
        return (
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-foreground/5 border border-foreground/10 flex-shrink-0">
                        <svg
                            className="w-4 h-4 text-foreground/70"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </span>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground/80">Threshold</div>
                        <div className="text-xs text-foreground/60">Required approvals</div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="font-mono font-semibold text-foreground/90">{threshold}</div>
                    <div className="text-xs text-foreground/60">Out of {totalWeight}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-foreground/5 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Threshold</h2>
            <div>
                <div className="bg-background px-4 py-3 rounded-md border border-foreground/20 inline-block">
                    <span className="bg-foreground/10 px-3 py-1 rounded-full font-semibold text-sm">
                        {threshold} out of  {totalWeight} required
                    </span>
                </div>
            </div>
        </div>
    );

}