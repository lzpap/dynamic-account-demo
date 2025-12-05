import { useQuery } from '@tanstack/react-query';
import { queryKey } from './queryKey';

export function useGetAccountsForAddress(address: string) {
    return useQuery({
        queryKey: queryKey.member_accounts(address),
        queryFn: async () => {
            // TODO: Refactor with a proper client call to the indexer service
            const data = await fetch(`http://127.0.0.1:3030/accounts/${address}`).then(res => res.json()) as getAccountsForAddress;

            return data.accounts;
        },
        enabled: !!address,
        staleTime: 1000,
        retry: false,
    });
}

export type getAccountsForAddress = {
    accounts: string[];
} 