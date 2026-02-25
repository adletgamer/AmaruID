import { db, type OfflineQueueItem } from './schema';

export async function enqueue(
  type: OfflineQueueItem['type'],
  payload: Record<string, unknown>
): Promise<string> {
  const id = crypto.randomUUID();
  await db.offlineQueue.add({
    id,
    type,
    payload: JSON.stringify(payload),
    status: 'pending',
    retries: 0,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function getPendingItems(): Promise<OfflineQueueItem[]> {
  return db.offlineQueue.where('status').equals('pending').toArray();
}

export async function markProcessing(id: string): Promise<void> {
  await db.offlineQueue.update(id, {
    status: 'processing',
    lastAttempt: new Date().toISOString(),
  });
}

export async function markFailed(id: string, error: string): Promise<void> {
  const item = await db.offlineQueue.get(id);
  if (item) {
    await db.offlineQueue.update(id, {
      status: 'failed',
      retries: item.retries + 1,
      error,
      lastAttempt: new Date().toISOString(),
    });
  }
}

export async function markCompleted(id: string): Promise<void> {
  await db.offlineQueue.delete(id);
}

export async function retryFailed(): Promise<void> {
  const failed = await db.offlineQueue
    .where('status')
    .equals('failed')
    .filter((item) => item.retries < 3)
    .toArray();

  for (const item of failed) {
    await db.offlineQueue.update(item.id, { status: 'pending' });
  }
}

export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  failed: number;
}> {
  const [pending, processing, failed] = await Promise.all([
    db.offlineQueue.where('status').equals('pending').count(),
    db.offlineQueue.where('status').equals('processing').count(),
    db.offlineQueue.where('status').equals('failed').count(),
  ]);
  return { pending, processing, failed };
}
