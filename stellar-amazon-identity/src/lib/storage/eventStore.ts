/**
 * Event Storage - Storage for signed events and their lifecycle
 */

import { db } from './schema';
import type { SignedEvent, EventStatus } from '../events/types';

export async function saveEvent(event: SignedEvent): Promise<void> {
  await db.signedEvents.put(event);
}

export async function getEventById(id: string): Promise<SignedEvent | undefined> {
  return db.signedEvents.get(id);
}

export async function getEventByHash(hash: string): Promise<SignedEvent | undefined> {
  return db.signedEvents.where('metadata_hash').equals(hash).first();
}

export async function getEventsByStatus(status: EventStatus): Promise<SignedEvent[]> {
  return db.signedEvents.where('status').equals(status).toArray();
}

export async function getPendingEvents(): Promise<SignedEvent[]> {
  return getEventsByStatus('pending');
}

export async function getValidatedEvents(): Promise<SignedEvent[]> {
  return getEventsByStatus('validated');
}

export async function getAnchoredEvents(): Promise<SignedEvent[]> {
  return getEventsByStatus('anchored');
}

export async function getEventsByPublicKey(publicKey: string): Promise<SignedEvent[]> {
  return db.signedEvents.where('actor_public_key').equals(publicKey).toArray();
}

export async function updateEventStatus(id: string, status: EventStatus): Promise<void> {
  await db.signedEvents.update(id, { status });
}

export async function addValidationToEvent(
  id: string,
  validation: SignedEvent['validations'][0]
): Promise<void> {
  const event = await db.signedEvents.get(id);
  if (event) {
    await db.signedEvents.update(id, {
      validations: [...event.validations, validation],
    });
  }
}

export async function setEventAnchorProof(
  id: string,
  merkleRoot: string,
  stellarTxHash: string
): Promise<void> {
  await db.signedEvents.update(id, {
    status: 'anchored',
    anchor_proof: {
      merkle_root: merkleRoot,
      stellar_tx_hash: stellarTxHash,
      anchored_at: Date.now(),
    },
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await db.signedEvents.delete(id);
}

export async function getAllEvents(): Promise<SignedEvent[]> {
  return db.signedEvents.toArray();
}

export async function getEventCount(): Promise<number> {
  return db.signedEvents.count();
}

export async function getEventCountByStatus(): Promise<Record<EventStatus, number>> {
  const [pending, validated, anchored] = await Promise.all([
    db.signedEvents.where('status').equals('pending').count(),
    db.signedEvents.where('status').equals('validated').count(),
    db.signedEvents.where('status').equals('anchored').count(),
  ]);
  return { pending, validated, anchored };
}
