import { createContext, useContext, useMemo, type ReactNode } from "react";

import { IsafeIndexerClient } from "@/lib/clients/IsafeIndexerClient";
import { CONFIG } from "@/config";


export const IsafeIndexerClientContext =
  createContext<IsafeIndexerClient | null>(null);

export interface IsafeIndexerClientProviderProps {
  children: ReactNode;
}

export function IsafeIndexerClientProvider({
  children,
}: IsafeIndexerClientProviderProps) {
  const client = useMemo(() => {
    return new IsafeIndexerClient(CONFIG.isafeIndexerUrl);
  }, []);

  return (
    <IsafeIndexerClientContext.Provider value={client}>
      {children}
    </IsafeIndexerClientContext.Provider>
  );
}

export function useIsafeIndexerClientContext(): IsafeIndexerClient {
  const context = useContext(IsafeIndexerClientContext);
  if (!context) {
    throw new Error(
      "useIsafeIndexerClientContext must be used within an IsafeIndexerClientProvider"
    );
  }
  return context;
}
