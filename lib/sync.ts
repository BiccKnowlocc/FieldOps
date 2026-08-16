import { createId } from './id';
import { getStorage, nowDoc } from './storage';
import { pushDocsToApi } from './api';
import type { Collection, ConflictRecord, StoredDoc } from './types';

const SYNCABLE: Collection[] = [
  'jobsites',
  'crew',
  'daily_logs',
  'punch_items',
  'media',
  'assets',
  'meter_entries',
  'inspections',
  'service_logs',
  'checkouts',
  'estimate_lines',
  'takeoffs',
  'change_orders',
  'receipts',
  'purchase_orders',
  'time_entries',
  'shifts',
  'work_orders',
  'toolbox_talks',
  'incidents',
  'drawings',
  'certifications',
  'bim_pins',
  'pay_apps',
  'lien_waivers',
  'drone_surveys',
];

function remoteId(entityId: string) {
  return `remote:${entityId}`;
}

let syncTenantId: string | null = null;

export function setSyncTenant(id: string | null) {
  syncTenantId = id;
}

export type SyncResult = {
  pushed: number;
  pulled: number;
  conflicts: number;
};

export async function runSync(): Promise<SyncResult> {
  const storage = getStorage();
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0 };

  for (const collection of SYNCABLE) {
    const localDocs = await storage.getAll(collection);
    for (const local of localDocs) {
      const remote = await storage.get(remoteId(local.id));
      if (!remote) {
        await storage.upsert({
          ...local,
          id: remoteId(local.id),
          collection: 'remote_mirror',
          updatedAt: local.updatedAt,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
        });
        await storage.upsert({
          ...local,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
        });
        result.pushed += 1;
        continue;
      }

      const localEdited = local.lastSyncedAt == null || local.updatedAt > local.lastSyncedAt;
      const remoteEdited = remote.updatedAt > (local.lastSyncedAt ?? 0);

      if (localEdited && remoteEdited && remote.updatedAt !== local.updatedAt) {
        const conflict: ConflictRecord = {
          id: createId(),
          collection,
          entityId: local.id,
          local,
          remote: { ...remote, id: local.id, collection },
          createdAt: Date.now(),
        };
        await storage.upsert(
          nowDoc({
            id: conflict.id,
            collection: 'conflicts',
            data: conflict,
            syncStatus: 'conflict',
          }),
        );
        await storage.upsert({ ...local, syncStatus: 'conflict' });
        result.conflicts += 1;
        continue;
      }

      if (remote.updatedAt > local.updatedAt) {
        await storage.upsert({
          ...remote,
          id: local.id,
          collection,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
        });
        result.pulled += 1;
      } else {
        await storage.upsert({
          ...local,
          id: remoteId(local.id),
          collection: 'remote_mirror',
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
        });
        await storage.upsert({
          ...local,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
        });
        result.pushed += 1;
      }
    }
  }

  if (syncTenantId) {
    const pending: StoredDoc[] = [];
    for (const collection of SYNCABLE) {
      const docs = await storage.getAll(collection);
      pending.push(...docs.filter((doc) => doc.syncStatus === 'pending'));
    }
    const remote = await pushDocsToApi(syncTenantId, pending);
    if (remote.pushed > result.pushed) result.pushed = remote.pushed;
  }

  return result;
}

export async function resolveConflict(conflictId: string, choice: 'local' | 'remote') {
  const storage = getStorage();
  const doc = await storage.get<ConflictRecord>(conflictId);
  if (!doc) return;
  const winner: StoredDoc = choice === 'local' ? doc.data.local : doc.data.remote;
  await storage.upsert({
    ...winner,
    id: doc.data.entityId,
    collection: doc.data.collection,
    updatedAt: Date.now(),
    syncStatus: 'pending',
    lastSyncedAt: null,
  });
  await storage.upsert({
    ...winner,
    id: remoteId(doc.data.entityId),
    collection: 'remote_mirror',
    updatedAt: Date.now(),
    syncStatus: 'synced',
    lastSyncedAt: Date.now(),
  });
  await storage.remove(conflictId);
}

export async function simulateRemoteEdit(entityId: string) {
  const storage = getStorage();
  const local = await storage.get(entityId);
  if (!local) return;
  const remote = {
    ...local,
    id: remoteId(entityId),
    collection: 'remote_mirror' as const,
    updatedAt: Date.now() + 1000,
    data:
      local.collection === 'punch_items'
        ? { ...(local.data as object), title: `${(local.data as { title?: string }).title ?? 'Item'} (office edit)` }
        : local.data,
  };
  await storage.upsert(remote);
  await storage.upsert({
    ...local,
    updatedAt: Date.now() + 500,
    syncStatus: 'pending',
  });
}
