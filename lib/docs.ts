import type { Collection, StoredDoc, SyncStatus } from './types';

export interface StorageAdapter {
  init(): Promise<void>;
  getAll<T>(collection: Collection): Promise<StoredDoc<T>[]>;
  get<T>(id: string): Promise<StoredDoc<T> | null>;
  upsert<T>(doc: StoredDoc<T>): Promise<void>;
  remove(id: string): Promise<void>;
}

export function nowDoc<T>(input: {
  id: string;
  collection: Collection;
  data: T;
  syncStatus?: SyncStatus;
  lastSyncedAt?: number | null;
  deletedAt?: number | null;
}): StoredDoc<T> {
  return {
    id: input.id,
    collection: input.collection,
    data: input.data,
    updatedAt: Date.now(),
    deletedAt: input.deletedAt ?? null,
    syncStatus: input.syncStatus ?? 'pending',
    lastSyncedAt: input.lastSyncedAt ?? null,
  };
}
