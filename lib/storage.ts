import * as SQLite from 'expo-sqlite';

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

class SqliteAdapter implements StorageAdapter {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabaseAsync('fieldops.db');
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS docs (
        id TEXT PRIMARY KEY NOT NULL,
        collection TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT NOT NULL,
        last_synced_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_docs_collection ON docs(collection);
    `);
  }

  private requireDb() {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async getAll<T>(collection: Collection) {
    const rows = await this.requireDb().getAllAsync<RawRow>(
      'SELECT * FROM docs WHERE collection = ? AND deleted_at IS NULL ORDER BY updated_at DESC',
      collection,
    );
    return rows.map((row) => parseRow<T>(row));
  }

  async get<T>(id: string) {
    const row = await this.requireDb().getFirstAsync<RawRow>('SELECT * FROM docs WHERE id = ?', id);
    return row ? parseRow<T>(row) : null;
  }

  async upsert<T>(doc: StoredDoc<T>) {
    await this.requireDb().runAsync(
      `INSERT INTO docs (id, collection, data, updated_at, deleted_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         collection = excluded.collection,
         data = excluded.data,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         sync_status = excluded.sync_status,
         last_synced_at = excluded.last_synced_at`,
      [
        doc.id,
        doc.collection,
        JSON.stringify(doc.data),
        doc.updatedAt,
        doc.deletedAt,
        doc.syncStatus,
        doc.lastSyncedAt,
      ],
    );
  }

  async remove(id: string) {
    await this.requireDb().runAsync('DELETE FROM docs WHERE id = ?', id);
  }
}

let adapter: StorageAdapter | null = null;

export async function initStorage() {
  adapter = new SqliteAdapter();
  await adapter.init();
  return adapter;
}

export function getStorage() {
  if (!adapter) throw new Error('Storage not initialized');
  return adapter;
}
