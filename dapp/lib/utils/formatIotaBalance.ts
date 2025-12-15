import { NANOS_PER_IOTA } from "@iota/iota-sdk/utils";

export function formatIotaBalance(balance: string): string {
  const balanceNano = BigInt(balance);
  const balanceIota = balanceNano / NANOS_PER_IOTA;
  // Group digits in threes
  const formatted = balanceIota.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${formatted} IOTA`;
}