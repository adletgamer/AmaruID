/**
 * Anchor Storage - Storage for anchor proofs and merkle proofs
 */

import { db, type StoredAnchorProof, type StoredMerkleProof } from './schema';
import type { AnchorProof } from '../stellar/anchoring';
import type { MerkleProof } from '../crypto/merkle';

export async function saveAnchorProof(proof: AnchorProof): Promise<string> {
  const id = crypto.randomUUID();
  const storedProof: StoredAnchorProof = {
    ...proof,
    id,
  };
  await db.anchorProofs.add(storedProof);
  return id;
}

export async function getAnchorProofById(id: string): Promise<StoredAnchorProof | undefined> {
  return db.anchorProofs.get(id);
}

export async function getAnchorProofByTxHash(txHash: string): Promise<StoredAnchorProof | undefined> {
  return db.anchorProofs.where('tx_hash').equals(txHash).first();
}

export async function getAnchorProofByMerkleRoot(root: string): Promise<StoredAnchorProof | undefined> {
  return db.anchorProofs.where('root').equals(root).first();
}

export async function getAllAnchorProofs(): Promise<StoredAnchorProof[]> {
  return db.anchorProofs.orderBy('anchored_at').reverse().toArray();
}

export async function saveMerkleProof(
  eventId: string,
  proof: MerkleProof,
  anchorId: string
): Promise<string> {
  const id = crypto.randomUUID();
  const storedProof: StoredMerkleProof = {
    id,
    eventId,
    proof,
    anchorId,
  };
  await db.merkleProofs.add(storedProof);
  return id;
}

export async function getMerkleProofByEventId(eventId: string): Promise<StoredMerkleProof | undefined> {
  return db.merkleProofs.where('eventId').equals(eventId).first();
}

export async function getMerkleProofsByAnchorId(anchorId: string): Promise<StoredMerkleProof[]> {
  return db.merkleProofs.where('anchorId').equals(anchorId).toArray();
}

export async function deleteAnchorProof(id: string): Promise<void> {
  await db.transaction('rw', [db.anchorProofs, db.merkleProofs], async () => {
    await db.merkleProofs.where('anchorId').equals(id).delete();
    await db.anchorProofs.delete(id);
  });
}

export async function getAnchorStats(): Promise<{
  totalAnchors: number;
  totalEvents: number;
  latestAnchor?: StoredAnchorProof;
}> {
  const allProofs = await db.anchorProofs.toArray();
  const totalEvents = allProofs.reduce((sum, p) => sum + p.event_count, 0);
  const latestAnchor = allProofs.sort((a, b) => 
    new Date(b.anchored_at).getTime() - new Date(a.anchored_at).getTime()
  )[0];
  
  return {
    totalAnchors: allProofs.length,
    totalEvents,
    latestAnchor,
  };
}
