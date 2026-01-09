import { useQuery } from "@tanstack/react-query";
import { queryKey } from "./queryKey";
import { useIsafeIndexerClientContext } from "@/contexts";

export function useGetAccountEvents(address: string) {
  const indexerClient = useIsafeIndexerClientContext();
  return useQuery({
    queryKey: queryKey.events(address),
    queryFn: async () => {
      return indexerClient.getAccountEvents(address);
    },
    enabled: !!address,
    staleTime: 1000,
    retry: false,
  });
}
