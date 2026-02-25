import Dexie, { type EntityTable } from 'dexie';
import type { CommunityAccount, LeaderAccount, MemberAccount } from '@/types/account';
import type { ConservationAction } from '@/types/action';
import type { ReputationScore, ReputationEvent } from '@/types/reputation';

export interface OfflineQueueItem {
  id: string;
  type: 'identity' | 'action' | 'certification' | 'multisig';
  payload: string;
  status: 'pending' | 'processing' | 'failed';
  retries: number;
  createdAt: string;
  lastAttempt?: string;
  error?: string;
}

export class AmaruDatabase extends Dexie {
  communities!: EntityTable<CommunityAccount, 'id'>;
  leaders!: EntityTable<LeaderAccount, 'id'>;
  members!: EntityTable<MemberAccount, 'id'>;
  actions!: EntityTable<ConservationAction, 'id'>;
  reputationScores!: EntityTable<ReputationScore, 'memberId'>;
  reputationEvents!: EntityTable<ReputationEvent, 'id'>;
  offlineQueue!: EntityTable<OfflineQueueItem, 'id'>;

  constructor() {
    super('AmaruID');

    this.version(1).stores({
      communities: 'id, publicKey, name',
      leaders: 'id, publicKey, communityId',
      members: 'id, publicKey, communityId, certified',
      actions: 'id, memberId, memberPublicKey, category, status, createdAt',
      reputationScores: 'memberId, memberPublicKey, totalScore',
      reputationEvents: 'id, memberId, type, createdAt',
      offlineQueue: 'id, type, status, createdAt',
    });
  }
}

export const db = new AmaruDatabase();
