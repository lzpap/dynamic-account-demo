import { useQueries } from "@tanstack/react-query";
import { queryKey } from "./queryKey";
import { useTxServiceClientContext } from "@/contexts";
import type { TransactionDetailsResponse } from "@/lib/clients/TxServiceClient";

export function useGetTransactionDetails(transactionDigests: string[]) {
  const txServiceClient = useTxServiceClientContext();

  return useQueries({
    queries: transactionDigests.map((digest) => ({
      queryKey: queryKey.transactionDetails(digest),
      queryFn: async () => {
        return txServiceClient.getTransaction(digest);
      },
    })),
    combine: (results) => {
      const data = results.map((res) => res.data) as TransactionDetailsResponse[];
      const isLoading = results.some((res) => res.isLoading);
      const error = results.find((res) => res.error)?.error || null;
      return { data, isLoading, error };
    }
  });
}

export type { TransactionDetailsResponse } from "@/lib/clients/TxServiceClient";