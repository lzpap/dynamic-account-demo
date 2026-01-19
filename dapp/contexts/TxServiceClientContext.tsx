import { createContext, useContext, useMemo, type ReactNode } from "react";

import { TxServiceClient } from "@/lib/clients/TxServiceClient";
import { CONFIG } from "@/config";

export const TxServiceClientContext = createContext<TxServiceClient | null>(
  null
);

export interface TxServiceClientProviderProps {
  children: ReactNode;
}

export function TxServiceClientProvider({
  children,
}: TxServiceClientProviderProps) {
  const client = useMemo(() => {
    return new TxServiceClient(CONFIG.txServiceUrl);
  }, []);

  return (
    <TxServiceClientContext.Provider value={client}>
      {children}
    </TxServiceClientContext.Provider>
  );
}

export function useTxServiceClientContext(): TxServiceClient {
  const context = useContext(TxServiceClientContext);
  if (!context) {
    throw new Error(
      "useTxServiceClientContext must be used within a TxServiceClientProvider"
    );
  }
  return context;
}
