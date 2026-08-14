import { nowDoc, type StorageAdapter } from './docs';
import type { Collection, StoredDoc, SyncStatus } from './types';

export { nowDoc };

type RawRow = {
  id: string;
  collection: string;
  data: string;
  updated_at: number;
  deleted_at: number | null;
  sync_status: string;
  last_synced_at: number | null;
};

function parseRow<T>(row: RawRow): StoredDoc<T> {
  return {
    id: row.id,
    collection: row.collection as Collection,
    data: JSON.parse(row.data) as T,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status as SyncStatus,
    lastSyncedAt: row.last_synced_at,
  };
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class IdbAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;

  async init() {
    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('fieldops', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('docs')) {
          const store = db.createObjectStore('docs', { keyPath: 'id' });
          store.createIndex('collection', 'collection', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private requireDb() {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  private tx(mode: IDBTransactionMode) {
    return this.requireDb().transaction('docs', mode).objectStore('docs');
  }

  async getAll<T>(collection: Collection) {
    const store = this.tx('readonly');
    const index = store.index('collection');
    const rows = await requestToPromise<RawRow[]>(index.getAll(collection));
    return rows
      .filter((row) => row.deleted_at == null)
      .map((row) => parseRow<T>(row))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async get<T>(id: string) {
    const row = await requestToPromise<RawRow | undefined>(this.tx('readonly').get(id));
    return row ? parseRow<T>(row) : null;
  }

  async upsert<T>(doc: StoredDoc<T>) {
    const row: RawRow = {
      id: doc.id,
      collection: doc.collection,
      data: JSON.stringify(doc.data),
      updated_at: doc.updatedAt,
      deleted_at: doc.deletedAt,
      sync_status: doc.syncStatus,
      last_synced_at: doc.lastSyncedAt,
    };
    await requestToPromise(this.tx('readwrite').put(row));
  }

  async remove(id: string) {
    await requestToPromise(this.tx('readwrite').delete(id));
  }
}

let adapter: StorageAdapter | null = null;

export async function initStorage() {
  adapter = new IdbAdapter();
  await adapter.init();
  return adapter;
}

export function getStorage() {
  if (!adapter) throw new Error('Storage not initialized');
  return adapter;
}
