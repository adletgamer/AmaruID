import { useCallback, useState } from 'react';
import { setupMultisig, type MultisigSetupParams } from '@/lib/stellar/multisig';
import type { TransactionResult } from '@/types/stellar';

export function useMultisig() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configureMultisig = useCallback(async (params: MultisigSetupParams): Promise<TransactionResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await setupMultisig(params);
      if (!result.success) {
        setError(result.error || 'Error configuring multisig');
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    configureMultisig,
    loading,
    error,
  };
}
