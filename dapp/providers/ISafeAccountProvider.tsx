import { createContext, useState, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { normalizeIotaAddress, isValidIotaAddress } from '@iota/iota-sdk/utils';

const isafeAccountContext = createContext({isafeAccount: '', toggleAccount: (accountId: string) => {} });

export function ISafeAccountProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const firstPathSegment = pathname.split('/')[1]; // Extract account ID from URL if needed
  // if the first path segment is a valid account ID, set it as the current iSafe account
  let normalizedAddress = '';

  if (isValidIotaAddress(firstPathSegment)) {
    normalizedAddress = normalizeIotaAddress(firstPathSegment, false, true);
  }

  const [isafeAccount, setCurrentIsafeAccount] = useState(normalizedAddress);

  const toggleAccount = (accountId: string) => {
    setCurrentIsafeAccount(accountId);
  };

  return (
    <isafeAccountContext.Provider value={{ isafeAccount, toggleAccount }}>
      {children}
    </isafeAccountContext.Provider>
  );
}

// Custom hook
export const useISafeAccount = () => useContext(isafeAccountContext);