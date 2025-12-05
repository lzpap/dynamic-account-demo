import { useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { queryKey } from './queryKey';
import { CONFIG } from '@/config/config';

// Move struct types for parsing
type MoveAccountContent = {
    dataType: 'moveObject';
    type: string;
    fields: {
        id: { id: string };
        allowed_authenticators: {
            type: string;
            fields: {
                id: { id: string };
                size: string;
            };
        };
    };
};

export type AllowedAuthenticatorsInfo = {
    tableId: string;
    size: number;
};

export function useGetAllowedAuthenticators(accountId: string) {
    const client = useIotaClient();

    const expectedType = `${CONFIG.packageId}::account::Account`;

    return useQuery({
        queryKey: queryKey.allowed_authenticators(accountId),
        queryFn: async (): Promise<string[]> => {
            const data = await client.getObject({ id: accountId, options: { showType: true, showContent: true } });
            console.log('Fetched account object:', data);
            
            if (data.error) {
                throw new Error(`Error fetching account object: ${data.error}`);
            }

            // Check if type is the correct one for isafe account
            if (data.data?.type !== expectedType) {
                throw new Error(`Account object is not of type isafeAccount. Found type: ${data.data?.type}`);
            }

            // Parse content
            const content = data.data?.content as MoveAccountContent | undefined;
            if (!content || content.dataType !== 'moveObject') {
                throw new Error('Account content is not a Move object');
            }

            const allowedAuth = content.fields.allowed_authenticators;

            const tableId = allowedAuth.fields.id.id;

            // we can now fetch the entries of the table

            const auth_data = await client.getDynamicFields({ parentId: tableId });

            const allowedAppKeys = auth_data.data.map(entry => {
                return entry.name.value as string
            });
            return allowedAppKeys;
        },
        enabled: !!accountId,
        staleTime: Infinity,
        retry: false,
    });
}

