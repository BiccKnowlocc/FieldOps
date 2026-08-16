import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';

import { useAuth } from '@/context/AuthContext';
import { seedCostingIfNeeded, seedEquipmentIfNeeded, seedIfNeeded, seedLaborIfNeeded, seedSafetyIfNeeded } from '@/lib/seed';
import { getStorage, initStorage, nowDoc } from '@/lib/storage';
import { resolveConflict as resolveConflictRecord, runSync, simulateRemoteEdit, type SyncResult } from '@/lib/sync';
import { assetMatchesCode } from '@/lib/equipment';
import { coerceFuelL, coerceTempC } from '@/lib/units';
import type {
  AppSettings,
  Asset,
  Certification,
  ChangeOrder,
  CheckoutEvent,
  ConflictRecord,
  CrewMember,
  DailyLog,
  Drawing,
  EstimateLine,
  Incident,
  Inspection,
  Jobsite,
  MediaItem,
  MeterEntry,
  PunchItem,
  PurchaseOrder,
  Receipt,
  ServiceLog,
  Shift,
  Takeoff,
  TimeEntry,
  ToolboxTalk,
  WorkOrder,
  BimPin,
  PayApp,
  LienWaiver,
  DroneSurvey,
  Collection,
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
  assets: Asset[];
  inspections: Inspection[];
  conflicts: ConflictRecord[];
  pendingCount: number;
  setJobsite: (id: string) => Promise<void>;
  saveLog: (log: DailyLog) => Promise<void>;
  savePunch: (item: PunchItem) => Promise<void>;
  saveMedia: (item: MediaItem) => Promise<void>;
  saveAsset: (asset: Asset) => Promise<void>;
  saveMeterEntry: (entry: MeterEntry) => Promise<void>;
  saveInspection: (inspection: Inspection) => Promise<void>;
  saveServiceLog: (log: ServiceLog) => Promise<void>;
  saveCheckout: (event: CheckoutEvent) => Promise<void>;
  getLog: (id: string) => DailyLog | undefined;
  getPunch: (id: string) => PunchItem | undefined;
  getMedia: (id: string) => MediaItem | undefined;
  getAsset: (id: string) => Asset | undefined;
  findAssetByCode: (code: string) => Asset | undefined;
  estimateLines: EstimateLine[];
  takeoffs: Takeoff[];
  changeOrders: ChangeOrder[];
  receipts: Receipt[];
  purchaseOrders: PurchaseOrder[];
  saveEstimateLine: (line: EstimateLine) => Promise<void>;
  saveTakeoff: (takeoff: Takeoff) => Promise<void>;
  saveChangeOrder: (order: ChangeOrder) => Promise<void>;
  saveReceipt: (receipt: Receipt) => Promise<void>;
  savePurchaseOrder: (po: PurchaseOrder) => Promise<void>;
  getChangeOrder: (id: string) => ChangeOrder | undefined;
  allCrew: CrewMember[];
  timeEntries: TimeEntry[];
  shifts: Shift[];
  workOrders: WorkOrder[];
  saveTimeEntry: (entry: TimeEntry) => Promise<void>;
  saveShift: (shift: Shift) => Promise<void>;
  saveWorkOrder: (order: WorkOrder) => Promise<void>;
  getWorkOrder: (id: string) => WorkOrder | undefined;
  talks: ToolboxTalk[];
  incidents: Incident[];
  drawings: Drawing[];
  certifications: Certification[];
  saveTalk: (talk: ToolboxTalk) => Promise<void>;
  saveIncident: (incident: Incident) => Promise<void>;
  saveDrawing: (drawing: Drawing) => Promise<void>;
  saveCertification: (cert: Certification) => Promise<void>;
  getTalk: (id: string) => ToolboxTalk | undefined;
  getIncident: (id: string) => Incident | undefined;
  getDrawing: (id: string) => Drawing | undefined;
  bimPins: BimPin[];
  payApps: PayApp[];
  waivers: LienWaiver[];
  droneSurveys: DroneSurvey[];
  saveRecord: <T>(id: string, collection: Collection, data: T) => Promise<void>;
  refresh: () => Promise<void>;
  syncNow: () => Promise<SyncResult>;
  resolveConflict: (id: string, choice: 'local' | 'remote') => Promise<void>;
  simulateConflict: () => Promise<void>;
};

const FieldOpsContext = createContext<FieldOpsContextValue | null>(null);

export function FieldOpsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [jobsites, setJobsites] = useState<Jobsite[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [estimateLines, setEstimateLines] = useState<EstimateLine[]>([]);
  const [takeoffs, setTakeoffs] = useState<Takeoff[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [allCrew, setAllCrew] = useState<CrewMember[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [talks, setTalks] = useState<ToolboxTalk[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [bimPins, setBimPins] = useState<BimPin[]>([]);
  const [payApps, setPayApps] = useState<PayApp[]>([]);
  const [waivers, setWaivers] = useState<LienWaiver[]>([]);
  const [droneSurveys, setDroneSurveys] = useState<DroneSurvey[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    const storage = getStorage();
    const [
      settingsDoc,
      jobDocs,
      crewDocs,
      logDocs,
      punchDocs,
      mediaDocs,
      assetDocs,
      inspectDocs,
      meterDocs,
      serviceDocs,
      checkoutDocs,
      estimateDocs,
      takeoffDocs,
      coDocs,
      receiptDocs,
      poDocs,
      timeDocs,
      shiftDocs,
      woDocs,
      talkDocs,
      incidentDocs,
      drawingDocs,
      certDocs,
      pinDocs,
      payDocs,
      waiverDocs,
      droneDocs,
      conflictDocs,
    ] = await Promise.all([
      storage.get<AppSettings>('app'),
      storage.getAll<Jobsite>('jobsites'),
      storage.getAll<CrewMember>('crew'),
      storage.getAll<DailyLog>('daily_logs'),
      storage.getAll<PunchItem>('punch_items'),
      storage.getAll<MediaItem>('media'),
      storage.getAll<Asset>('assets'),
      storage.getAll<Inspection>('inspections'),
      storage.getAll<MeterEntry>('meter_entries'),
      storage.getAll<ServiceLog>('service_logs'),
      storage.getAll<CheckoutEvent>('checkouts'),
      storage.getAll<EstimateLine>('estimate_lines'),
      storage.getAll<Takeoff>('takeoffs'),
      storage.getAll<ChangeOrder>('change_orders'),
      storage.getAll<Receipt>('receipts'),
      storage.getAll<PurchaseOrder>('purchase_orders'),
      storage.getAll<TimeEntry>('time_entries'),
      storage.getAll<Shift>('shifts'),
      storage.getAll<WorkOrder>('work_orders'),
      storage.getAll<ToolboxTalk>('toolbox_talks'),
      storage.getAll<Incident>('incidents'),
      storage.getAll<Drawing>('drawings'),
      storage.getAll<Certification>('certifications'),
      storage.getAll<BimPin>('bim_pins'),
      storage.getAll<PayApp>('pay_apps'),
      storage.getAll<LienWaiver>('lien_waivers'),
      storage.getAll<DroneSurvey>('drone_surveys'),
      storage.getAll<ConflictRecord>('conflicts'),
    ]);

    const selectedId = settingsDoc?.data.selectedJobsiteId ?? jobDocs[0]?.data.id;
    setSettings(settingsDoc?.data ?? null);
    setJobsites(jobDocs.map((d) => d.data));
    setAllCrew(crewDocs.map((d) => d.data));
    setCrew(crewDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setLogs(logDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => ({ ...d.data, tempC: coerceTempC(d.data) })));
    setPunchItems(punchDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setMedia(mediaDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setAssets(
      assetDocs.map((d) => ({
        ...d.data,
        fuelUsedLitres: coerceFuelL(d.data),
        meterUnit: d.data.meterUnit === 'hours' ? 'hours' : 'km',
      })),
    );
    setInspections(inspectDocs.map((d) => d.data));
    setEstimateLines(estimateDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setTakeoffs(takeoffDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setChangeOrders(coDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setReceipts(receiptDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setPurchaseOrders(poDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setTimeEntries(timeDocs.map((d) => d.data));
    setShifts(shiftDocs.map((d) => d.data));
    setWorkOrders(woDocs.map((d) => d.data));
    setTalks(talkDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setIncidents(incidentDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setDrawings(drawingDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setCertifications(certDocs.map((d) => d.data));
    setBimPins(pinDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setPayApps(payDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setWaivers(waiverDocs.map((d) => d.data));
    setDroneSurveys(droneDocs.filter((d) => d.data.jobsiteId === selectedId).map((d) => d.data));
    setConflicts(conflictDocs.map((d) => d.data));
    setPendingCount(
      [
        ...jobDocs,
        ...crewDocs,
        ...logDocs,
        ...punchDocs,
        ...mediaDocs,
        ...assetDocs,
        ...inspectDocs,
        ...meterDocs,
        ...serviceDocs,
        ...checkoutDocs,
        ...estimateDocs,
        ...takeoffDocs,
        ...coDocs,
        ...receiptDocs,
        ...poDocs,
        ...timeDocs,
        ...shiftDocs,
        ...woDocs,
        ...talkDocs,
        ...incidentDocs,
        ...drawingDocs,
        ...certDocs,
        ...pinDocs,
        ...payDocs,
        ...waiverDocs,
        ...droneDocs,
      ].filter((d) => d.syncStatus === 'pending' || d.syncStatus === 'conflict').length,
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initStorage();
        await seedIfNeeded();
        await seedEquipmentIfNeeded();
        await seedCostingIfNeeded();
        await seedLaborIfNeeded();
        await seedSafetyIfNeeded();
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
        unitsVersion: settings?.unitsVersion,
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

  const saveAsset = useCallback(
    async (asset: Asset) => {
      await getStorage().upsert(nowDoc({ id: asset.id, collection: 'assets', data: asset }));
      await refresh();
    },
    [refresh],
  );

  const saveMeterEntry = useCallback(
    async (entry: MeterEntry) => {
      await getStorage().upsert(nowDoc({ id: entry.id, collection: 'meter_entries', data: entry }));
      await refresh();
    },
    [refresh],
  );

  const saveInspection = useCallback(
    async (inspection: Inspection) => {
      await getStorage().upsert(nowDoc({ id: inspection.id, collection: 'inspections', data: inspection }));
      await refresh();
    },
    [refresh],
  );

  const saveServiceLog = useCallback(
    async (log: ServiceLog) => {
      await getStorage().upsert(nowDoc({ id: log.id, collection: 'service_logs', data: log }));
      await refresh();
    },
    [refresh],
  );

  const saveCheckout = useCallback(
    async (event: CheckoutEvent) => {
      await getStorage().upsert(nowDoc({ id: event.id, collection: 'checkouts', data: event }));
      await refresh();
    },
    [refresh],
  );

  const saveEstimateLine = useCallback(
    async (line: EstimateLine) => {
      await getStorage().upsert(nowDoc({ id: line.id, collection: 'estimate_lines', data: line }));
      await refresh();
    },
    [refresh],
  );

  const saveTakeoff = useCallback(
    async (takeoff: Takeoff) => {
      await getStorage().upsert(nowDoc({ id: takeoff.id, collection: 'takeoffs', data: takeoff }));
      await refresh();
    },
    [refresh],
  );

  const saveChangeOrder = useCallback(
    async (order: ChangeOrder) => {
      await getStorage().upsert(nowDoc({ id: order.id, collection: 'change_orders', data: order }));
      await refresh();
    },
    [refresh],
  );

  const saveReceipt = useCallback(
    async (receipt: Receipt) => {
      await getStorage().upsert(nowDoc({ id: receipt.id, collection: 'receipts', data: receipt }));
      await refresh();
    },
    [refresh],
  );

  const savePurchaseOrder = useCallback(
    async (po: PurchaseOrder) => {
      await getStorage().upsert(nowDoc({ id: po.id, collection: 'purchase_orders', data: po }));
      await refresh();
    },
    [refresh],
  );

  const saveTimeEntry = useCallback(
    async (entry: TimeEntry) => {
      await getStorage().upsert(nowDoc({ id: entry.id, collection: 'time_entries', data: entry }));
      await refresh();
    },
    [refresh],
  );

  const saveShift = useCallback(
    async (shift: Shift) => {
      await getStorage().upsert(nowDoc({ id: shift.id, collection: 'shifts', data: shift }));
      await refresh();
    },
    [refresh],
  );

  const saveWorkOrder = useCallback(
    async (order: WorkOrder) => {
      await getStorage().upsert(nowDoc({ id: order.id, collection: 'work_orders', data: order }));
      await refresh();
    },
    [refresh],
  );

  const saveTalk = useCallback(
    async (talk: ToolboxTalk) => {
      await getStorage().upsert(nowDoc({ id: talk.id, collection: 'toolbox_talks', data: talk }));
      await refresh();
    },
    [refresh],
  );

  const saveIncident = useCallback(
    async (incident: Incident) => {
      await getStorage().upsert(nowDoc({ id: incident.id, collection: 'incidents', data: incident }));
      await refresh();
    },
    [refresh],
  );

  const saveDrawing = useCallback(
    async (drawing: Drawing) => {
      await getStorage().upsert(nowDoc({ id: drawing.id, collection: 'drawings', data: drawing }));
      await refresh();
    },
    [refresh],
  );

  const saveCertification = useCallback(
    async (cert: Certification) => {
      await getStorage().upsert(nowDoc({ id: cert.id, collection: 'certifications', data: cert }));
      await refresh();
    },
    [refresh],
  );

  const saveRecord = useCallback(
    async <T,>(id: string, collection: Collection, data: T) => {
      await getStorage().upsert(nowDoc({ id, collection, data }));
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
      operatorName: session?.name ?? settings?.operatorName ?? 'Nick',
      jobsites,
      jobsite,
      crew,
      logs,
      punchItems,
      media,
      assets,
      inspections,
      conflicts,
      pendingCount,
      setJobsite,
      saveLog,
      savePunch,
      saveMedia,
      saveAsset,
      saveMeterEntry,
      saveInspection,
      saveServiceLog,
      saveCheckout,
      estimateLines,
      takeoffs,
      changeOrders,
      receipts,
      purchaseOrders,
      saveEstimateLine,
      saveTakeoff,
      saveChangeOrder,
      saveReceipt,
      savePurchaseOrder,
      allCrew,
      timeEntries,
      shifts,
      workOrders,
      saveTimeEntry,
      saveShift,
      saveWorkOrder,
      talks,
      incidents,
      drawings,
      certifications,
      saveTalk,
      saveIncident,
      saveDrawing,
      saveCertification,
      getLog: (id) => logs.find((l) => l.id === id),
      getPunch: (id) => punchItems.find((p) => p.id === id),
      getMedia: (id) => media.find((m) => m.id === id),
      getAsset: (id) => assets.find((a) => a.id === id),
      findAssetByCode: (code) => assets.find((a) => assetMatchesCode(a, code)),
      getChangeOrder: (id) => changeOrders.find((order) => order.id === id),
      getWorkOrder: (id) => workOrders.find((order) => order.id === id),
      getTalk: (id) => talks.find((talk) => talk.id === id),
      getIncident: (id) => incidents.find((item) => item.id === id),
      getDrawing: (id) => drawings.find((item) => item.id === id),
      bimPins,
      payApps,
      waivers,
      droneSurveys,
      saveRecord,
      refresh,
      syncNow,
      resolveConflict,
      simulateConflict,
    }),
    [
      ready,
      online,
      settings,
      session,
      jobsites,
      jobsite,
      crew,
      logs,
      punchItems,
      media,
      assets,
      inspections,
      conflicts,
      pendingCount,
      setJobsite,
      saveLog,
      savePunch,
      saveMedia,
      saveAsset,
      saveMeterEntry,
      saveInspection,
      saveServiceLog,
      saveCheckout,
      estimateLines,
      takeoffs,
      changeOrders,
      receipts,
      purchaseOrders,
      saveEstimateLine,
      saveTakeoff,
      saveChangeOrder,
      saveReceipt,
      savePurchaseOrder,
      allCrew,
      timeEntries,
      shifts,
      workOrders,
      saveTimeEntry,
      saveShift,
      saveWorkOrder,
      talks,
      incidents,
      drawings,
      certifications,
      saveTalk,
      saveIncident,
      saveDrawing,
      saveCertification,
      bimPins,
      payApps,
      waivers,
      droneSurveys,
      saveRecord,
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
