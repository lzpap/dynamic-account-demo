import { useQuery } from '@tanstack/react-query';
import { queryKey } from './queryKey';
import { useIsafeIndexerClientContext } from '@/contexts/IsafeIndexerClientContext';

export function useGetAccountsForAddress(address: string) {
    const indexerClient = useIsafeIndexerClientContext();
    return useQuery({
        queryKey: queryKey.member_accounts(address),
        queryFn: async () => {
            return indexerClient.getAccountsForAddress(address);
        },
        enabled: !!address,
        staleTime: 1000,
        retry: false,
    });
}

export type getAccountsForAddress = {
    accounts: string[];
} 