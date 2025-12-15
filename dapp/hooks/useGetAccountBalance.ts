import { useQuery } from '@tanstack/react-query';
import { queryKey } from './queryKey';
import { useIotaClient } from '@iota/dapp-kit';

export function useGetAccountBalance(accountAddress: string) {
    const client = useIotaClient();
  return useQuery({
    queryKey: queryKey.balance(accountAddress),
    queryFn: async () => {
    return await client.getBalance({ owner: accountAddress });
    },
    enabled: !!accountAddress,
    staleTime: 10000,
  });
}
