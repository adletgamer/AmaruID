/**
 * AmaruID Service - Unified service that wires all 4 layers together
 * 
 * Layer 1: Identity Layer (Offline)
 * Layer 2: Event Layer (Offline)
 * Layer 3: Validation Layer (P2P/Online)
 * Layer 4: Anchoring Layer (Online)
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { 
  generateIdentity, 
  unlockIdentity, 
  type EncryptedIdentity,
  type UnlockedIdentity 
} from '../crypto/identity';
import { 
  createSignedEvent, 
  verifyEvent, 
  addValidation,
  verifyValidation,
  hasReachedThreshold,
  setAnchorProof
} from '../events/signedEvent';
import type { SignedEvent, EventMetadata, EventType } from '../events/types';
import { createMetadata } from '../events/signedEvent';
import { buildMerkleTree, getMerkleProof } from '../crypto/merkle';
import { anchorToStellar, verifyAnchor, type AnchorProof } from '../stellar/anchoring';
import { 
  saveIdentity, 
  getActiveIdentity, 
  hasIdentity
} from '../storage/identityStore';
import type { StoredIdentity } from '../storage/schema';
import { 
  saveEvent, 
  getPendingEvents, 
  getValidatedEvents,
  updateEventStatus,
  setEventAnchorProof,
  getEventCountByStatus
} from '../storage/eventStore';
import { 
  saveAnchorProof, 
  saveMerkleProof,
  getAnchorStats 
} from '../storage/anchorStore';

export interface AmaruServiceConfig {
  validationThreshold: number;
  autoAnchorThreshold: number;
}

const DEFAULT_CONFIG: AmaruServiceConfig = {
  validationThreshold: 3,
  autoAnchorThreshold: 10,
};

let currentIdentity: UnlockedIdentity | null = null;
let config: AmaruServiceConfig = DEFAULT_CONFIG;

export function configure(newConfig: Partial<AmaruServiceConfig>): void {
  config = { ...config, ...newConfig };
}

export async function createIdentity(
  passphrase: string,
  name?: string
): Promise<{ identity: EncryptedIdentity; id: string }> {
  const identity = await generateIdentity(passphrase);
  const id = await saveIdentity(identity, name);
  return { identity, id };
}

export async function unlock(passphrase: string): Promise<UnlockedIdentity> {
  const stored = await getActiveIdentity();
  if (!stored) {
    throw new Error('No active identity found. Create one first.');
  }
  
  currentIdentity = await unlockIdentity(stored, passphrase);
  return currentIdentity;
}

export function getCurrentIdentity(): UnlockedIdentity | null {
  return currentIdentity;
}

export function lock(): void {
  currentIdentity = null;
}

export function isUnlocked(): boolean {
  return currentIdentity !== null;
}

export async function isInitialized(): Promise<boolean> {
  return hasIdentity();
}

export async function recordAction(
  type: EventType,
  action: string,
  data: Record<string, unknown>,
  evidence: string[] = [],
  location?: { lat: number; lng: number }
): Promise<SignedEvent> {
  if (!currentIdentity) {
    throw new Error('Identity not unlocked. Call unlock() first.');
  }

  const metadata = createMetadata(type, action, data, evidence, location);
  const signedEvent = await createSignedEvent(metadata, currentIdentity.keypair);
  await saveEvent(signedEvent);
  
  return signedEvent;
}

export async function validateEvent(
  event: SignedEvent,
  validatorKeypair: StellarSdk.Keypair
): Promise<SignedEvent> {
  const verificationResult = await verifyEvent(event);
  if (!verificationResult.is_valid) {
    throw new Error(`Event verification failed: ${verificationResult.error}`);
  }

  const updatedEvent = addValidation(event, validatorKeypair);
  await saveEvent(updatedEvent);

  if (hasReachedThreshold(updatedEvent, config.validationThreshold)) {
    await updateEventStatus(updatedEvent.id, 'validated');
    updatedEvent.status = 'validated';
  }

  return updatedEvent;
}

export async function anchorValidatedEvents(
  signerKeypair: StellarSdk.Keypair
): Promise<{ 
  success: boolean; 
  proof?: AnchorProof; 
  anchoredCount: number;
  error?: string;
}> {
  const validatedEvents = await getValidatedEvents();
  
  if (validatedEvents.length === 0) {
    return { success: false, anchoredCount: 0, error: 'No validated events to anchor' };
  }

  const result = await anchorToStellar(validatedEvents, signerKeypair);
  
  if (!result.success || !result.proof) {
    return { success: false, anchoredCount: 0, error: result.error };
  }

  const anchorId = await saveAnchorProof(result.proof);

  const eventHashes = validatedEvents.map(e => e.metadata_hash);
  const tree = await buildMerkleTree(eventHashes);

  for (const event of validatedEvents) {
    const proof = getMerkleProof(tree, event.metadata_hash);
    if (proof) {
      await saveMerkleProof(event.id, proof, anchorId);
    }
    await setEventAnchorProof(event.id, result.proof.root, result.proof.tx_hash);
  }

  return { 
    success: true, 
    proof: result.proof, 
    anchoredCount: validatedEvents.length 
  };
}

export async function verifyEventOnChain(
  event: SignedEvent
): Promise<{ verified: boolean; error?: string }> {
  if (!event.anchor_proof) {
    return { verified: false, error: 'Event has not been anchored' };
  }

  return verifyAnchor(event.anchor_proof.stellar_tx_hash, event.anchor_proof.merkle_root);
}

export async function getSystemStatus(): Promise<{
  hasIdentity: boolean;
  isUnlocked: boolean;
  eventCounts: { pending: number; validated: number; anchored: number };
  anchorStats: { totalAnchors: number; totalEvents: number };
}> {
  const [hasId, eventCounts, anchorStats] = await Promise.all([
    hasIdentity(),
    getEventCountByStatus(),
    getAnchorStats(),
  ]);

  return {
    hasIdentity: hasId,
    isUnlocked: isUnlocked(),
    eventCounts,
    anchorStats: {
      totalAnchors: anchorStats.totalAnchors,
      totalEvents: anchorStats.totalEvents,
    },
  };
}

export async function syncPendingEvents(): Promise<SignedEvent[]> {
  return getPendingEvents();
}

export { 
  type SignedEvent,
  type EventMetadata,
  type EventType,
  type AnchorProof,
  type EncryptedIdentity,
  type UnlockedIdentity,
  type StoredIdentity,
};
