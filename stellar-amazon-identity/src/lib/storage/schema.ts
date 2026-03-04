import Dexie, { type EntityTable } from 'dexie';
import type { CommunityAccount, LeaderAccount, MemberAccount } from '@/types/account';
import type { ConservationAction } from '@/types/action';
import type { ReputationScore, ReputationEvent } from '@/types/reputation';
import type { SignedEvent } from '../events/types';
import type { EncryptedIdentity } from '../crypto/identity';
import type { AnchorProof } from '../stellar/anchoring';
import type { MerkleProof } from '../crypto/merkle';

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

export interface StoredIdentity extends EncryptedIdentity {
  id: string;
  name?: string;
  isActive: boolean;
}

export interface StoredAnchorProof extends AnchorProof {
  id: string;
}

export interface StoredMerkleProof {
  id: string;
  eventId: string;
  proof: MerkleProof;
  anchorId: string;
}

export class AmaruDatabase extends Dexie {
  communities!: EntityTable<CommunityAccount, 'id'>;
  leaders!: EntityTable<LeaderAccount, 'id'>;
  members!: EntityTable<MemberAccount, 'id'>;
  actions!: EntityTable<ConservationAction, 'id'>;
  reputationScores!: EntityTable<ReputationScore, 'memberId'>;
  reputationEvents!: EntityTable<ReputationEvent, 'id'>;
  offlineQueue!: EntityTable<OfflineQueueItem, 'id'>;
  identities!: EntityTable<StoredIdentity, 'id'>;
  signedEvents!: EntityTable<SignedEvent, 'id'>;
  anchorProofs!: EntityTable<StoredAnchorProof, 'id'>;
  merkleProofs!: EntityTable<StoredMerkleProof, 'id'>;

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

    this.version(2).stores({
      communities: 'id, publicKey, name',
      leaders: 'id, publicKey, communityId',
      members: 'id, publicKey, communityId, certified',
      actions: 'id, memberId, memberPublicKey, category, status, createdAt',
      reputationScores: 'memberId, memberPublicKey, totalScore',
      reputationEvents: 'id, memberId, type, createdAt',
      offlineQueue: 'id, type, status, createdAt',
      identities: 'id, publicKey, identifier, isActive',
      signedEvents: 'id, publicKey, status, createdAt, [status+createdAt]',
      anchorProofs: 'id, merkleRoot, stellarTxHash, timestamp',
      merkleProofs: 'id, eventId, anchorId',
    });

    // Version 3: Updated AnchorProof field names to snake_case
    this.version(3).stores({
      communities: 'id, publicKey, name',
      leaders: 'id, publicKey, communityId',
      members: 'id, publicKey, communityId, certified',
      actions: 'id, memberId, memberPublicKey, category, status, createdAt',
      reputationScores: 'memberId, memberPublicKey, totalScore',
      reputationEvents: 'id, memberId, type, createdAt',
      offlineQueue: 'id, type, status, createdAt',
      identities: 'id, publicKey, identifier, isActive',
      signedEvents: 'id, publicKey, status, createdAt, [status+createdAt]',
      anchorProofs: 'id, root, tx_hash, anchored_at',
      merkleProofs: 'id, eventId, anchorId',
    });
  }
}

export const db = new AmaruDatabase();
