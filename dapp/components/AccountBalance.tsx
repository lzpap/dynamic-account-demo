import { useGetAccountBalance } from "@/hooks/useGetAccountBalance";
import { formatIotaBalance } from "@/lib/utils/formatIotaBalance";

export function AccountBalance({
  accountAddress,
  compact = false,
}: {
  accountAddress: string;
  compact?: boolean;
}) {
  const { data: balance, isLoading, isError } = useGetAccountBalance(accountAddress);

  const formatted =
    isLoading
      ? "Loading..."
      : isError
        ? "Error"
        : balance
          ? formatIotaBalance(balance.totalBalance)
          : "";

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
                d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground/80">Balance</div>
            <div className="text-xs text-foreground/60">Total IOTA</div>
          </div>
        </div>
        <div className="text-right font-mono font-semibold text-foreground/90 truncate">
          {formatted}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/80 backdrop-blur rounded-lg p-5 border border-foreground/10 hover:border-foreground/20 transition-all hover:shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" />
        </svg>
        <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Balance</h3>
      </div>
      <div className="text-3xl font-mono font-bold text-foreground/90">{formatted}</div>
    </div>
  );
}
