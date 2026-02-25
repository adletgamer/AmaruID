import { useCallback, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useStellar } from './useStellar';
import { useOfflineStorage } from './useOfflineStorage';
import type { CommunityAccount, LeaderAccount, MemberAccount } from '@/types/account';

export function useAccounts() {
  const { refreshAccounts, community, leaders, members } = useAuthContext();
  const { generateNewKeypair, fundWithFriendbot, isOnline } = useStellar();
  const { saveCommunity, saveLeader, saveMember } = useOfflineStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCommunity = useCallback(
    async (name: string, description: string): Promise<CommunityAccount | null> => {
      setLoading(true);
      setError(null);
      try {
        const keypair = generateNewKeypair();
        let funded = false;
        if (isOnline) {
          funded = await fundWithFriendbot(keypair.publicKey);
        }
        const account: CommunityAccount = {
          id: crypto.randomUUID(),
          publicKey: keypair.publicKey,
          name,
          description,
          role: 'community',
          signers: [],
          thresholdLow: 1,
          thresholdMed: 2,
          thresholdHigh: 2,
          createdAt: new Date().toISOString(),
          funded,
        };
        await saveCommunity(account);
        await refreshAccounts();
        return account;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error creating community');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [generateNewKeypair, fundWithFriendbot, isOnline, saveCommunity, refreshAccounts]
  );

  const createLeader = useCallback(
    async (name: string, communityId: string): Promise<LeaderAccount | null> => {
      setLoading(true);
      setError(null);
      try {
        const keypair = generateNewKeypair();
        let funded = false;
        if (isOnline) {
          funded = await fundWithFriendbot(keypair.publicKey);
        }
        const account: LeaderAccount = {
          id: crypto.randomUUID(),
          publicKey: keypair.publicKey,
          secretKey: keypair.secretKey,
          name,
          role: 'leader',
          communityId,
          createdAt: new Date().toISOString(),
          funded,
        };
        await saveLeader(account);
        await refreshAccounts();
        return account;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error creating leader');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [generateNewKeypair, fundWithFriendbot, isOnline, saveLeader, refreshAccounts]
  );

  const createMember = useCallback(
    async (name: string, communityId: string): Promise<MemberAccount | null> => {
      setLoading(true);
      setError(null);
      try {
        const keypair = generateNewKeypair();
        let funded = false;
        if (isOnline) {
          funded = await fundWithFriendbot(keypair.publicKey);
        }
        const account: MemberAccount = {
          id: crypto.randomUUID(),
          publicKey: keypair.publicKey,
          secretKey: keypair.secretKey,
          name,
          role: 'member',
          communityId,
          certified: false,
          createdAt: new Date().toISOString(),
          funded,
        };
        await saveMember(account);
        await refreshAccounts();
        return account;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error creating member');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [generateNewKeypair, fundWithFriendbot, isOnline, saveMember, refreshAccounts]
  );

  return {
    community,
    leaders,
    members,
    createCommunity,
    createLeader,
    createMember,
    loading,
    error,
    refreshAccounts,
  };
}
