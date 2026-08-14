import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';

import { seedIfNeeded } from '@/lib/seed';
import { getStorage, initStorage, nowDoc } from '@/lib/storage';
import { resolveConflict as resolveConflictRecord, runSync, simulateRemoteEdit, type SyncResult } from '@/lib/sync';
import type {
  AppSettings,
  ConflictRecord,
  CrewMember,
  DailyLog,
  Jobsite,
  MediaItem,
  PunchItem,
} from '@/lib/types';

type FieldOpsContextValue = {
  ready: boolean;
  online: boolean;
  operatorName: string;
  jobsites: Jobsite[];
  jobsite: Jobsite | null;
  crew: CrewMember[];
  logs: DailyLog[];
  punchItems: PunchItem[];
  media: MediaItem[];
  conflicts: ConflictRecord[];
  pendingCount: number;
  setJobsite: (id: string) => Promise<void>;
  saveLog: (log: DailyLog) => Promise<void>;
  savePunch: (item: PunchItem) => Promise<void>;
  saveMedia: (item: MediaItem) => Promise<void>;
  getLog: (id: string) => DailyLog | undefined;
  getPunch: (id: string) => PunchItem | undefined;
  getMedia: (id: string) => MediaItem | undefined;
  refresh: () => Promise<void>;
  syncNow: () => Promise<SyncResult>;
  resolveConflict: (id: string, choice: 'local' | 'remote') => Promise<void>;
  simulateConflict: () => Promise<void>;
};

const FieldOpsContext = createContext<FieldOpsContextValue | null>(null);

export function FieldOpsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [jobsites, setJobsites] = useState<Jobsite[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    const storage = getStorage();
    const [settingsDoc, jobDocs, crewDocs, logDocs, punchDocs, mediaDocs, conflictDocs] = await Promise.all([
      storage.get<AppSettings>('app'),
      storage.getAll<Jobsite>('jobsites'),
      storage.getAll<CrewMember>('crew'),
      storage.getAll<DailyLog>('daily_logs'),
      storage.getAll<PunchItem>('punch_items'),
      storage.getAll<MediaItem>('media'),
      storage.getAll<ConflictRecord>('conflicts'),
    ]);

    const selectedId = settingsDoc?.data.selectedJobsiteId ?? jobDocs[0]?.data.id;
    setSettings(settingsDoc?.data ?? null);
    setJobsites(jobDocs.map((d) => d.data));
    setCrew(crewDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setLogs(logDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setPunchItems(punchDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setMedia(mediaDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setConflicts(conflictDocs.map((d) => d.data));
    setPendingCount(
      [...jobDocs, ...crewDocs, ...logDocs, ...punchDocs, ...mediaDocs].filter(
        (d) => d.syncStatus === 'pending' || d.syncStatus === 'conflict',
      ).length,
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initStorage();
        await seedIfNeeded();
        const net = await getNetworkStateAsync();
        if (!mounted) return;
        setOnline(Boolean(net.isConnected));
        await refresh();
        setReady(true);
      } catch (error) {
        console.error('FieldOps failed to start', error);
      }
    })();
    const sub = addNetworkStateListener((state) => {
      setOnline(Boolean(state.isConnected));
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [refresh]);

  useEffect(() => {
    if (!ready || !online || pendingCount === 0) return;
    const timer = setTimeout(() => {
      runSync().then(() => refresh()).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [ready, online, pendingCount, refresh]);

  const jobsite = useMemo(
    () => jobsites.find((j) => j.id === settings?.selectedJobsiteId) ?? jobsites[0] ?? null,
    [jobsites, settings],
  );

  const setJobsite = useCallback(
    async (id: string) => {
      const next: AppSettings = {
        selectedJobsiteId: id,
        operatorName: settings?.operatorName ?? 'Nick',
      };
      await getStorage().upsert(nowDoc({ id: 'app', collection: 'settings', data: next, syncStatus: 'synced' }));
      await refresh();
    },
    [refresh, settings],
  );

  const saveLog = useCallback(
    async (log: DailyLog) => {
      await getStorage().upsert(nowDoc({ id: log.id, collection: 'daily_logs', data: log }));
      await refresh();
    },
    [refresh],
  );

  const savePunch = useCallback(
    async (item: PunchItem) => {
      await getStorage().upsert(nowDoc({ id: item.id, collection: 'punch_items', data: item }));
      await refresh();
    },
    [refresh],
  );

  const saveMedia = useCallback(
    async (item: MediaItem) => {
      await getStorage().upsert(nowDoc({ id: item.id, collection: 'media', data: item }));
      await refresh();
    },
    [refresh],
  );

  const syncNow = useCallback(async () => {
    const result = await runSync();
    await refresh();
    return result;
  }, [refresh]);

  const resolveConflict = useCallback(
    async (id: string, choice: 'local' | 'remote') => {
      await resolveConflictRecord(id, choice);
      await refresh();
    },
    [refresh],
  );

  const simulateConflict = useCallback(async () => {
    const target = punchItems[0];
    if (!target) return;
    await simulateRemoteEdit(target.id);
    await refresh();
  }, [punchItems, refresh]);

  const value = useMemo<FieldOpsContextValue>(
    () => ({
      ready,
      online,
      operatorName: settings?.operatorName ?? 'Nick',
      jobsites,
      jobsite,
      crew,
      logs,
      punchItems,
      media,
      conflicts,
      pendingCount,
      setJobsite,
      saveLog,
      savePunch,
      saveMedia,
      getLog: (id) => logs.find((l) => l.id === id),
      getPunch: (id) => punchItems.find((p) => p.id === id),
      getMedia: (id) => media.find((m) => m.id === id),
      refresh,
      syncNow,
      resolveConflict,
      simulateConflict,
    }),
    [
      ready,
      online,
      settings,
      jobsites,
      jobsite,
      crew,
      logs,
      punchItems,
      media,
      conflicts,
      pendingCount,
      setJobsite,
      saveLog,
      savePunch,
      saveMedia,
      refresh,
      syncNow,
      resolveConflict,
      simulateConflict,
    ],
  );

  return <FieldOpsContext.Provider value={value}>{children}</FieldOpsContext.Provider>;
}

export function useFieldOps() {
  const ctx = useContext(FieldOpsContext);
  if (!ctx) throw new Error('useFieldOps must be used within FieldOpsProvider');
  return ctx;
}
