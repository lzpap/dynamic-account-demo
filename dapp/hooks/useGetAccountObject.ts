import { useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { queryKey } from './queryKey';
import { CONFIG } from '@/config/config';

export function useGetAccountObject(accountId: string) {
    const client = useIotaClient();

    const expectedType = `${CONFIG.packageId}::account::Account`;
    
    // const expectedType = "0x3::iota_system::IotaSystemState";

    return useQuery({
        queryKey: queryKey.accountObject(accountId),
        queryFn: async () => {
            const data = await client.getObject({ id: accountId , options: {showType: true}});
            console.log('Fetched account object:', data);
            if (data.error) {
                throw new Error(`Error fetching account object: ${data.error}`);
            };

            // check if type is the cprrect one for isafe account
            if (data.data?.type !== expectedType) {
                throw new Error(`Account object is not of type isafeAccount. Found type: ${data.data?.type}`);
            };
            return data;
        },
        enabled: !!accountId,
        staleTime: Infinity,
        retry: false,
    });
}