'use client';

interface ThresholdProps {
  accountAddress: string;
  compact?: boolean;
}

export function Threshold({ accountAddress, compact = false }: ThresholdProps) {
    // TODO: Fetch threshold data here, for now hardcoding
    // hint: can call the view function threshold() from the iSafe smart contract with the address
    // can call total_weight() similarly
    const threshold = 2;
    const totalWeight = 4;

    if (compact) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{threshold}</span>
                    <span className="text-xs text-foreground/60 uppercase">Required</span>
                </div>
                <div className="text-sm text-foreground/70">
                    <span className="font-medium">Out of:</span> {totalWeight}
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