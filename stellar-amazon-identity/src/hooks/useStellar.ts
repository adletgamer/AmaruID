import { useState, useCallback } from 'react';
import { useStellarContext } from '@/contexts/StellarContext';
import type { StellarAccountInfo } from '@/types/stellar';

export function useStellar() {
  const { generateNewKeypair, loadAccount, fundWithFriendbot, isOnline, config } =
    useStellarContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAndFundAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const keypair = generateNewKeypair();
      if (isOnline) {
        const funded = await fundWithFriendbot(keypair.publicKey);
        if (!funded) {
          setError('Failed to fund account with Friendbot');
        }
        return { ...keypair, funded };
      }
      return { ...keypair, funded: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [generateNewKeypair, fundWithFriendbot, isOnline]);

  const fetchAccount = useCallback(
    async (publicKey: string): Promise<StellarAccountInfo | null> => {
      setLoading(true);
      setError(null);
      try {
        const info = await loadAccount(publicKey);
        if (!info) setError('Account not found');
        return info;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadAccount]
  );

  return {
    createAndFundAccount,
    fetchAccount,
    generateNewKeypair,
    fundWithFriendbot,
    loading,
    error,
    isOnline,
    config,
  };
}
