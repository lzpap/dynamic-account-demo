import { createContext, useState, useContext } from 'react';

const isafeAccountContext = createContext({isafeAccount: '', toggleAccount: (accountId: string) => {} });

export function ISafeAccountProvider({ children }: { children: React.ReactNode }) {
  const [isafeAccount, setCurrentIsafeAccount] = useState('');

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