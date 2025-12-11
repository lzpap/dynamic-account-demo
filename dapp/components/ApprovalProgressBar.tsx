interface ApprovalProgressBarProps {
  currentApprovals: number;
  threshold: number;
  totalAccountWeight: number;
}

export function ApprovalProgressBar({
  currentApprovals,
  threshold,
  totalAccountWeight,
}: ApprovalProgressBarProps) {
  const fillPercent =
    totalAccountWeight > 0 ? (currentApprovals / totalAccountWeight) * 100 : 0;
  const thresholdPercent =
    totalAccountWeight > 0 ? (threshold / totalAccountWeight) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-foreground/60 mb-1">
        <span>
          {currentApprovals} / {totalAccountWeight} weight
        </span>
        <span>Threshold: {threshold}</span>
      </div>
      <div className="relative h-2 bg-foreground/10 rounded-full overflow-visible">
        {/* Filled portion */}
        <div
          className="absolute h-full bg-yellow-500 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(fillPercent, 100)}%` }}
        />
        {/* Threshold marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground/70"
          style={{ left: `${Math.min(thresholdPercent, 100)}%` }}
          title={`Threshold: ${threshold}`}
        />
      </div>
    </div>
  );
}
