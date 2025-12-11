export function formatTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
