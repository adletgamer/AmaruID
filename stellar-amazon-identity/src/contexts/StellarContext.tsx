import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { StellarConfig, StellarAccountInfo } from '@/types/stellar';
import { getConfig, getAccountInfo, fundAccount, generateKeypair } from '@/lib/stellar/client';

interface StellarContextType {
  config: StellarConfig;
  isOnline: boolean;
  generateNewKeypair: () => { publicKey: string; secretKey: string };
  loadAccount: (publicKey: string) => Promise<StellarAccountInfo | null>;
  fundWithFriendbot: (publicKey: string) => Promise<boolean>;
}

const StellarContext = createContext<StellarContextType | null>(null);

export function StellarProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  const generateNewKeypair = useCallback(() => {
    return generateKeypair();
  }, []);

  const loadAccount = useCallback(async (publicKey: string) => {
    return getAccountInfo(publicKey);
  }, []);

  const fundWithFriendbot = useCallback(async (publicKey: string) => {
    return fundAccount(publicKey);
  }, []);

  return (
    <StellarContext.Provider
      value={{
        config: getConfig(),
        isOnline,
        generateNewKeypair,
        loadAccount,
        fundWithFriendbot,
      }}
    >
      {children}
    </StellarContext.Provider>
  );
}

export function useStellarContext() {
  const context = useContext(StellarContext);
  if (!context) {
    throw new Error('useStellarContext must be used within a StellarProvider');
  }
  return context;
}
