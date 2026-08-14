import { addDaysISO, todayISO } from './dates';
import { createId } from './id';
import { getStorage, nowDoc } from './storage';
import type {
  AppSettings,
  CrewMember,
  DailyLog,
  Jobsite,
  PunchItem,
} from './types';

const DEMO_JOBSITE_ID = 'job-riverside-a';

export async function seedIfNeeded() {
  const storage = getStorage();
  const existing = await storage.getAll<Jobsite>('jobsites');
  if (existing.length > 0) return;

  const jobsite: Jobsite = {
    id: DEMO_JOBSITE_ID,
    name: 'Riverside Warehouse — Building A',
    address: '4200 Industrial Way',
    lat: 39.7684,
    lng: -86.1581,
    geofenceRadiusM: 200,
    status: 'active',
  };

  const crew: CrewMember[] = [
    { id: createId(), jobsiteId: DEMO_JOBSITE_ID, name: 'Marcus Hale', role: 'Foreman', company: 'FieldOps GC', trade: 'general' },
    { id: createId(), jobsiteId: DEMO_JOBSITE_ID, name: 'Ana Ruiz', role: 'Operator', company: 'FieldOps GC', trade: 'sitework' },
    { id: createId(), jobsiteId: DEMO_JOBSITE_ID, name: 'Jamal Brooks', role: 'Carpenter', company: 'Northframe', trade: 'framing' },
    { id: createId(), jobsiteId: DEMO_JOBSITE_ID, name: 'Priya Shah', role: 'Electrician', company: 'Volt & Co', trade: 'electrical' },
    { id: createId(), jobsiteId: DEMO_JOBSITE_ID, name: 'Chris Nguyen', role: 'Laborer', company: 'FieldOps GC', trade: 'general' },
  ];

  const settings: AppSettings = {
    selectedJobsiteId: DEMO_JOBSITE_ID,
    operatorName: 'Nick',
  };

  const log: DailyLog = {
    id: createId(),
    jobsiteId: DEMO_JOBSITE_ID,
    logDate: todayISO(),
    weather: 'clear',
    tempF: 72,
    crewIds: crew.slice(0, 3).map((c) => c.id),
    workChips: ['Framing', 'MEP rough-in'],
    workNotes: 'Second-floor walls stood. Electric rough started in Rooms 204–208.',
    visitors: [{ id: createId(), name: 'Dana Cole', company: 'Owner rep', purpose: 'Owner walk' }],
    deliveries: [{ id: createId(), supplier: 'ABC Lumber', description: '2x6 stud package', received: true }],
    delays: [],
    createdBy: 'Nick',
    createdAt: Date.now(),
  };

  const punches: PunchItem[] = [
    {
      id: createId(),
      jobsiteId: DEMO_JOBSITE_ID,
      title: 'Missing fire caulk at corridor penetrations',
      description: 'Several MEP sleeves on Level 2 corridor are not firestopped.',
      trade: 'electrical',
      assignee: 'Priya Shah',
      company: 'Volt & Co',
      priority: 'high',
      status: 'open',
      dueDate: addDaysISO(todayISO(), 3),
      locationNote: 'Level 2 corridor, grid D-8',
      beforeMediaIds: [],
      afterMediaIds: [],
      createdAt: Date.now(),
    },
    {
      id: createId(),
      jobsiteId: DEMO_JOBSITE_ID,
      title: 'Slab edge spall at dock ramp',
      description: 'Repair and protect before next pour.',
      trade: 'concrete',
      assignee: 'Marcus Hale',
      company: 'FieldOps GC',
      priority: 'medium',
      status: 'in_progress',
      dueDate: addDaysISO(todayISO(), 7),
      locationNote: 'Dock 3 ramp',
      beforeMediaIds: [],
      afterMediaIds: [],
      createdAt: Date.now() - 86_400_000,
    },
  ];

  await storage.upsert(nowDoc({ id: 'app', collection: 'settings', data: settings, syncStatus: 'synced' }));
  await storage.upsert(nowDoc({ id: jobsite.id, collection: 'jobsites', data: jobsite, syncStatus: 'synced' }));
  for (const member of crew) {
    await storage.upsert(nowDoc({ id: member.id, collection: 'crew', data: member, syncStatus: 'synced' }));
  }
  await storage.upsert(nowDoc({ id: log.id, collection: 'daily_logs', data: log, syncStatus: 'synced' }));
  for (const punch of punches) {
    await storage.upsert(nowDoc({ id: punch.id, collection: 'punch_items', data: punch, syncStatus: 'pending' }));
  }
}
