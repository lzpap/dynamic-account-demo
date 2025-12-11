import { useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { queryKey } from './queryKey';
import { CONFIG } from '@/config/config';

export function useGetAccountTransactions(accountId: string) {
    const client = useIotaClient();

    const expectedType = `${CONFIG.packageId}::account::Account`;

    return useQuery({
        queryKey: queryKey.transactions(accountId),
        queryFn: async () => {
            // get all transactions from the custom indexer for the account

            // TODO: replace with proper client call when available
            const data = await fetch(`http://127.0.0.1:3030/transactions/${accountId}`).then(res => res.json()) as getTransctionsForAccount;

            // sort them into proposed, approved, executed
            return {
                proposed: data.transactions.filter(tx => tx.status === 'Proposed'),
                approved: data.transactions.filter(tx => tx.status === 'Approved'),
                executed: data.transactions.filter(tx => tx.status === 'Executed'),
            };


        },
        enabled: !!accountId,
        staleTime: 1000,
        // TODO figure out refetching strategy
        refetchInterval: 3000,
        retry: false,
    });
}


export type getTransctionsForAccount = {
    transactions: TransactionSummary[];
} 

export type TransactionSummary = {
    transactionDigest: string;
    proposerAddress: string;
    status: 'Proposed' | 'Approved' | 'Executed' | 'Rejected';
    currentApprovals: number;
    threshold: number;
    totalAccountWeight: number;
    approvedBy: string[];
    createdAt: number;
}

export type SortedTransactions = {
    proposed: TransactionSummary[];
    approved: TransactionSummary[];
    executed: TransactionSummary[];
}