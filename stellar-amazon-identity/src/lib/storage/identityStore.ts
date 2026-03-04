/**
 * Identity Storage - Secure storage for encrypted identities
 */

import { db, type StoredIdentity } from './schema';
import type { EncryptedIdentity } from '../crypto/identity';

export async function saveIdentity(
  identity: EncryptedIdentity,
  name?: string
): Promise<string> {
  const id = crypto.randomUUID();
  
  const existingActive = await db.identities.where('isActive').equals(1).first();
  
  const storedIdentity: StoredIdentity = {
    ...identity,
    id,
    name,
    isActive: !existingActive,
  };
  
  await db.identities.add(storedIdentity);
  return id;
}

export async function getActiveIdentity(): Promise<StoredIdentity | undefined> {
  return db.identities.where('isActive').equals(1).first();
}

export async function getIdentityById(id: string): Promise<StoredIdentity | undefined> {
  return db.identities.get(id);
}

export async function getIdentityByPublicKey(publicKey: string): Promise<StoredIdentity | undefined> {
  return db.identities.where('publicKey').equals(publicKey).first();
}

export async function getAllIdentities(): Promise<StoredIdentity[]> {
  return db.identities.toArray();
}

export async function setActiveIdentity(id: string): Promise<void> {
  await db.transaction('rw', db.identities, async () => {
    await db.identities.where('isActive').equals(1).modify({ isActive: false });
    await db.identities.update(id, { isActive: true });
  });
}

export async function deleteIdentity(id: string): Promise<void> {
  const identity = await db.identities.get(id);
  if (identity?.isActive) {
    throw new Error('Cannot delete active identity. Set another identity as active first.');
  }
  await db.identities.delete(id);
}

export async function updateIdentityName(id: string, name: string): Promise<void> {
  await db.identities.update(id, { name });
}

export async function hasIdentity(): Promise<boolean> {
  const count = await db.identities.count();
  return count > 0;
}
