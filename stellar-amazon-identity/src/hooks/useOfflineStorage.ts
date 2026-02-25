import { useState, useCallback } from 'react';
import { db } from '@/lib/storage/schema';
import * as queue from '@/lib/storage/queue';
import type { CommunityAccount, LeaderAccount, MemberAccount } from '@/types/account';
import type { ConservationAction } from '@/types/action';

export function useOfflineStorage() {
  const [saving, setSaving] = useState(false);

  const saveCommunity = useCallback(async (community: CommunityAccount) => {
    setSaving(true);
    try {
      await db.communities.put(community);
    } finally {
      setSaving(false);
    }
  }, []);

  const saveLeader = useCallback(async (leader: LeaderAccount) => {
    setSaving(true);
    try {
      await db.leaders.put(leader);
    } finally {
      setSaving(false);
    }
  }, []);

  const saveMember = useCallback(async (member: MemberAccount) => {
    setSaving(true);
    try {
      await db.members.put(member);
    } finally {
      setSaving(false);
    }
  }, []);

  const saveAction = useCallback(async (action: ConservationAction) => {
    setSaving(true);
    try {
      await db.actions.put(action);
    } finally {
      setSaving(false);
    }
  }, []);

  const getActions = useCallback(async (memberId?: string) => {
    if (memberId) {
      return db.actions.where('memberId').equals(memberId).toArray();
    }
    return db.actions.toArray();
  }, []);

  const getPendingActions = useCallback(async () => {
    return db.actions.where('status').equals('pending').toArray();
  }, []);

  const enqueueOfflineAction = useCallback(
    async (type: 'identity' | 'action' | 'certification' | 'multisig', payload: Record<string, unknown>) => {
      return queue.enqueue(type, payload);
    },
    []
  );

  return {
    saving,
    saveCommunity,
    saveLeader,
    saveMember,
    saveAction,
    getActions,
    getPendingActions,
    enqueueOfflineAction,
  };
}
