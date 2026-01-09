import { useQueries, useQuery } from "@tanstack/react-query";
import { queryKey } from "./queryKey";

export function useGetTransactionDetails(transactionDigests: string[]) {
  return useQueries({
    queries: transactionDigests.map((digest) => ({
      queryKey: queryKey.transactionDetails(digest),
      queryFn: async () => {
        // get transaction details from the custom indexer for the transaction digest
        const response = await fetch(
          `http://127.0.0.1:3031/transaction/${digest}`
        ).then((res) => res.json()) as TransactionDetailsResponse;
        return response;
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

export type TransactionDetailsResponse = {
    bcs: string;
    sender: string;
    addedAt: number;
    description: string;
}