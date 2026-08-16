import { addDaysISO, todayISO } from './dates';
import { createId } from './id';
import { getStorage, nowDoc } from './storage';
import { coerceFuelL, coerceTempC, MI_TO_KM, UNITS_VERSION } from './units';
import type {
  AppSettings,
  Asset,
  Certification,
  ChangeOrder,
  CrewMember,
  DailyLog,
  Drawing,
  EstimateLine,
  Incident,
  Jobsite,
  PunchItem,
  Receipt,
  Shift,
  TimeEntry,
  ToolboxTalk,
  WorkOrder,
  PayApp,
} from './types';

const DEMO_JOBSITE_ID = 'job-riverside-a';
const DEMO_JOBSITE_B = 'job-riverside-b';

export async function seedIfNeeded() {
  const storage = getStorage();
  const existing = await storage.getAll<Jobsite>('jobsites');
  if (existing.length > 0) {
    await patchCanadaUnitsIfNeeded();
    await seedEquipmentIfNeeded(DEMO_JOBSITE_ID);
    await seedCostingIfNeeded(DEMO_JOBSITE_ID);
    await seedLaborIfNeeded(DEMO_JOBSITE_ID);
    await seedSafetyIfNeeded(DEMO_JOBSITE_ID);
    return;
  }

  const jobsite: Jobsite = {
    id: DEMO_JOBSITE_ID,
    name: 'Riverside Warehouse — Building A',
    address: '4200 Industrial Drive, Hamilton, ON L8L 4Y7',
    lat: 43.2557,
    lng: -79.8711,
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
    unitsVersion: 3,
  };

  const log: DailyLog = {
    id: createId(),
    jobsiteId: DEMO_JOBSITE_ID,
    logDate: todayISO(),
    weather: 'clear',
    tempC: 22,
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
  await seedEquipmentIfNeeded(DEMO_JOBSITE_ID);
  await seedCostingIfNeeded(DEMO_JOBSITE_ID);
  await seedLaborIfNeeded(DEMO_JOBSITE_ID);
  await seedSafetyIfNeeded(DEMO_JOBSITE_ID);
}

export async function seedEquipmentIfNeeded(jobsiteId?: string) {
  const storage = getStorage();
  const existing = await storage.getAll<Asset>('assets');
  if (existing.length > 0) return;

  const jobId = jobsiteId ?? (await storage.getAll<Jobsite>('jobsites'))[0]?.data.id;
  if (!jobId) return;

  const assets: Asset[] = [
    {
      id: 'asset-ex-12',
      jobsiteId: jobId,
      name: 'CAT 320 Excavator',
      kind: 'heavy',
      make: 'Caterpillar',
      model: '320',
      unitNumber: 'EX-12',
      qrCode: 'FO-EX12',
      meterUnit: 'hours',
      hourMeter: 238,
      idleHours: 41,
      fuelUsedLitres: 3255,
      lastOilHours: 0,
      lastHydHours: 0,
      status: 'available',
      assignedTo: null,
      assignedLocation: 'This jobsite',
    },
    {
      id: 'asset-ld-44',
      jobsiteId: jobId,
      name: 'Deere 644K Loader',
      kind: 'heavy',
      make: 'John Deere',
      model: '644K',
      unitNumber: 'LD-44',
      qrCode: 'FO-LD44',
      meterUnit: 'hours',
      hourMeter: 518,
      idleHours: 90,
      fuelUsedLitres: 5375,
      lastOilHours: 250,
      lastHydHours: 0,
      status: 'checked_out',
      assignedTo: 'Ana Ruiz',
      assignedLocation: 'This jobsite',
    },
    {
      id: 'asset-dz-51',
      jobsiteId: jobId,
      name: 'Komatsu D51 Dozer',
      kind: 'heavy',
      make: 'Komatsu',
      model: 'D51',
      unitNumber: 'DZ-51',
      qrCode: 'FO-DZ51',
      meterUnit: 'hours',
      hourMeter: 180,
      idleHours: 22,
      fuelUsedLitres: 1552,
      lastOilHours: 0,
      lastHydHours: 0,
      status: 'available',
      assignedTo: null,
      assignedLocation: 'This jobsite',
    },
    {
      id: 'asset-tl-88',
      jobsiteId: jobId,
      name: 'Milwaukee SDS Max',
      kind: 'tool',
      make: 'Milwaukee',
      model: 'SDS Max',
      unitNumber: 'TL-88',
      qrCode: 'FO-TL88',
      meterUnit: 'hours',
      hourMeter: 0,
      idleHours: 0,
      fuelUsedLitres: 0,
      lastOilHours: 0,
      lastHydHours: 0,
      status: 'checked_out',
      assignedTo: 'Jamal Brooks',
      assignedLocation: 'This jobsite',
    },
    {
      id: 'asset-tk-350',
      jobsiteId: jobId,
      name: 'Ford F-350 Mechanic',
      kind: 'truck',
      make: 'Ford',
      model: 'F-350',
      unitNumber: 'TK-350',
      qrCode: 'FO-TK350',
      meterUnit: 'km',
      hourMeter: 66355,
      idleHours: 0,
      fuelUsedLitres: 795,
      lastOilHours: 61142,
      lastHydHours: 0,
      status: 'available',
      assignedTo: null,
      assignedLocation: 'Yard',
    },
    {
      id: 'asset-gn-50',
      jobsiteId: jobId,
      name: 'Onan 50kW Generator',
      kind: 'heavy',
      make: 'Onan',
      model: '50kW',
      unitNumber: 'GN-50',
      qrCode: 'FO-GN50',
      meterUnit: 'hours',
      hourMeter: 249,
      idleHours: 12,
      fuelUsedLitres: 681,
      lastOilHours: 0,
      lastHydHours: 0,
      status: 'down',
      assignedTo: null,
      assignedLocation: 'This jobsite',
    },
  ];

  for (const asset of assets) {
    await storage.upsert(nowDoc({ id: asset.id, collection: 'assets', data: asset, syncStatus: 'pending' }));
  }
}

export async function seedCostingIfNeeded(jobsiteId?: string) {
  const storage = getStorage();
  const existing = await storage.getAll<EstimateLine>('estimate_lines');
  if (existing.length > 0) return;

  const jobId = jobsiteId ?? (await storage.getAll<Jobsite>('jobsites'))[0]?.data.id;
  if (!jobId) return;

  const lines: EstimateLine[] = [
    { id: 'est-labor', jobsiteId: jobId, costCode: '01-000', description: 'Site labor', qty: 400, unit: 'hr', unitCost: 85, source: 'estimate', takeoffId: null, changeOrderId: null },
    { id: 'est-conc', jobsiteId: jobId, costCode: '03-300', description: 'Slab and footings', qty: 120, unit: 'CY', unitCost: 185, source: 'estimate', takeoffId: null, changeOrderId: null },
    { id: 'est-lumber', jobsiteId: jobId, costCode: '06-100', description: 'Framing package', qty: 12000, unit: 'LF', unitCost: 3.25, source: 'estimate', takeoffId: null, changeOrderId: null },
    { id: 'est-dw', jobsiteId: jobId, costCode: '09-290', description: 'Drywall sheets', qty: 800, unit: 'sheet', unitCost: 14.5, source: 'estimate', takeoffId: null, changeOrderId: null },
    { id: 'est-agg', jobsiteId: jobId, costCode: '31-200', description: 'Stone base', qty: 200, unit: 'CY', unitCost: 42, source: 'estimate', takeoffId: null, changeOrderId: null },
    { id: 'est-fuel', jobsiteId: jobId, costCode: '02-200', description: 'Fuel allowance', qty: 6000, unit: 'ea', unitCost: 1, source: 'estimate', takeoffId: null, changeOrderId: null },
  ];

  const receipts: Receipt[] = [
    { id: 'rcp-1', jobsiteId: jobId, vendor: 'ABC Lumber', costCode: '06-100', amount: 1847, photoUri: null, ocrNote: '', createdAt: Date.now() - 86_400_000 },
    { id: 'rcp-2', jobsiteId: jobId, vendor: 'Fuel stop', costCode: '02-200', amount: 128, photoUri: null, ocrNote: '', createdAt: Date.now() - 36_000_000 },
    { id: 'rcp-3', jobsiteId: jobId, vendor: 'Ready-Mix Co', costCode: '03-300', amount: 3210, photoUri: null, ocrNote: '', createdAt: Date.now() - 12_000_000 },
  ];

  const changeOrder: ChangeOrder = {
    id: 'co-001',
    jobsiteId: jobId,
    number: 'CO-001',
    title: 'Extra concrete',
    laborHours: 16,
    laborRate: 85,
    lines: [{ id: 'col-1', description: 'Dock ramp thickening', qty: 8, unit: 'CY', unitCost: 185, costCode: '03-300' }],
    status: 'draft',
    signature: [],
    signedBy: null,
    signedAt: null,
    createdAt: Date.now() - 3_600_000,
  };

  for (const line of lines) {
    await storage.upsert(nowDoc({ id: line.id, collection: 'estimate_lines', data: line, syncStatus: 'synced' }));
  }
  for (const receipt of receipts) {
    await storage.upsert(nowDoc({ id: receipt.id, collection: 'receipts', data: receipt, syncStatus: 'pending' }));
  }
  await storage.upsert(nowDoc({ id: changeOrder.id, collection: 'change_orders', data: changeOrder, syncStatus: 'pending' }));
}

export async function seedLaborIfNeeded(jobsiteId?: string) {
  const storage = getStorage();
  const [times, shiftDocs, orderDocs] = await Promise.all([
    storage.getAll<TimeEntry>('time_entries'),
    storage.getAll<Shift>('shifts'),
    storage.getAll<WorkOrder>('work_orders'),
  ]);
  if (times.length + shiftDocs.length + orderDocs.length > 0) return;

  const jobId = jobsiteId ?? (await storage.getAll<Jobsite>('jobsites'))[0]?.data.id;
  if (!jobId) return;

  const siteB: Jobsite = {
    id: DEMO_JOBSITE_B,
    name: 'Riverside Warehouse — Building B',
    address: '4210 Industrial Drive, Hamilton, ON L8L 4Y8',
    lat: 43.2564,
    lng: -79.8698,
    geofenceRadiusM: 200,
    status: 'active',
  };
  const alreadyB = await storage.get<Jobsite>(DEMO_JOBSITE_B);
  if (!alreadyB) {
    await storage.upsert(nowDoc({ id: siteB.id, collection: 'jobsites', data: siteB, syncStatus: 'synced' }));
  }

  const crew = (await storage.getAll<CrewMember>('crew')).map((doc) => doc.data);
  const marcus = crew.find((member) => member.name === 'Marcus Hale');
  const ana = crew.find((member) => member.name === 'Ana Ruiz');
  const jamal = crew.find((member) => member.name === 'Jamal Brooks');
  const priya = crew.find((member) => member.name === 'Priya Shah');
  const chris = crew.find((member) => member.name === 'Chris Nguyen');
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const yesterday = addDaysISO(today, -1);

  if (ana) {
    await storage.upsert(
      nowDoc({
        id: 'time-ana-open',
        collection: 'time_entries',
        data: {
          id: 'time-ana-open',
          jobsiteId: jobId,
          crewId: ana.id,
          crewName: ana.name,
          taskCode: 'Sitework',
          clockIn: Date.now() - 8.5 * 3_600_000,
          clockOut: null,
          lat: 39.7685,
          lng: -86.158,
          accuracyM: 8,
          insideGeofence: true,
        } satisfies TimeEntry,
        syncStatus: 'pending',
      }),
    );
  }

  if (chris) {
    const [y, m, d] = yesterday.split('-').map(Number);
    const clockIn = new Date(y, m - 1, d, 7, 0).getTime();
    await storage.upsert(
      nowDoc({
        id: 'time-chris-ot',
        collection: 'time_entries',
        data: {
          id: 'time-chris-ot',
          jobsiteId: jobId,
          crewId: chris.id,
          crewName: chris.name,
          taskCode: 'Cleanup',
          clockIn,
          clockOut: clockIn + 9.5 * 3_600_000,
          lat: 39.7684,
          lng: -86.1581,
          accuracyM: 12,
          insideGeofence: true,
        } satisfies TimeEntry,
        syncStatus: 'pending',
      }),
    );
  }

  const shifts: Shift[] = [];
  if (marcus) {
    shifts.push({
      id: 'shift-marcus-today',
      jobsiteId: jobId,
      date: today,
      crewId: marcus.id,
      crewName: marcus.name,
      trade: 'general',
      assetId: 'asset-ex-12',
      startHour: 7,
      endHour: 15,
      alertSent: true,
    });
  }
  if (jamal) {
    shifts.push({
      id: 'shift-jamal-tom',
      jobsiteId: DEMO_JOBSITE_B,
      date: tomorrow,
      crewId: jamal.id,
      crewName: jamal.name,
      trade: 'framing',
      assetId: null,
      startHour: 6,
      endHour: 16,
      alertSent: false,
    });
  }
  if (priya) {
    shifts.push({
      id: 'shift-priya-today',
      jobsiteId: jobId,
      date: today,
      crewId: priya.id,
      crewName: priya.name,
      trade: 'electrical',
      assetId: null,
      startHour: 7,
      endHour: 15,
      alertSent: false,
    });
  }
  for (const shift of shifts) {
    await storage.upsert(nowDoc({ id: shift.id, collection: 'shifts', data: shift, syncStatus: 'pending' }));
  }

  const orders: WorkOrder[] = [
    {
      id: 'wo-104',
      jobsiteId: jobId,
      number: 'WO-104',
      company: 'Volt & Co',
      trade: 'electrical',
      title: 'Level 2 electrical rough',
      scope: 'Rooms 204–208 rough-in per latest lighting plan. Firestop sleeves as you go.',
      status: 'offered',
      deliveries: [],
      invoiceUri: null,
      invoiceAmount: null,
      createdAt: Date.now() - 86_400_000,
    },
    {
      id: 'wo-105',
      jobsiteId: jobId,
      number: 'WO-105',
      company: 'Northframe',
      trade: 'framing',
      title: 'Second-floor walls',
      scope: 'Stand remaining walls on grid D. Layout per rev 3.',
      status: 'accepted',
      deliveries: [{ id: 'del-1', note: 'Stud package on dock 2', createdAt: Date.now() - 5_000_000 }],
      invoiceUri: null,
      invoiceAmount: null,
      createdAt: Date.now() - 172_800_000,
    },
  ];
  for (const order of orders) {
    await storage.upsert(nowDoc({ id: order.id, collection: 'work_orders', data: order, syncStatus: 'pending' }));
  }
}

export async function seedSafetyIfNeeded(jobsiteId?: string) {
  const storage = getStorage();
  const existing = await storage.getAll<ToolboxTalk>('toolbox_talks');
  if (existing.length > 0) return;

  const jobId = jobsiteId ?? (await storage.getAll<Jobsite>('jobsites'))[0]?.data.id;
  if (!jobId) return;

  const crew = (await storage.getAll<CrewMember>('crew')).map((doc) => doc.data);
  const marcus = crew.find((member) => member.name === 'Marcus Hale');
  const ana = crew.find((member) => member.name === 'Ana Ruiz');
  const jamal = crew.find((member) => member.name === 'Jamal Brooks');
  const priya = crew.find((member) => member.name === 'Priya Shah');
  const chris = crew.find((member) => member.name === 'Chris Nguyen');
  const today = todayISO();
  const lastWeek = addDaysISO(today, -7);

  const talks: ToolboxTalk[] = [
    {
      id: 'talk-today',
      jobsiteId: jobId,
      date: today,
      topic: 'Fall protection',
      points: ['Harness on above 6 ft', 'Inspect lanyards before the first tie-off', 'Tie off before stepping off the deck'],
      attendeeIds: [marcus, ana, jamal].flatMap((member) => (member ? [member.id] : [])),
      createdAt: Date.now() - 3_600_000,
    },
    {
      id: 'talk-silica',
      jobsiteId: jobId,
      date: lastWeek,
      topic: 'Silica / dust',
      points: ['Water on the cut', 'Respirator if dry cutting', 'Keep bystanders upwind'],
      attendeeIds: crew.map((member) => member.id),
      createdAt: Date.now() - 7 * 86_400_000,
    },
  ];
  for (const talk of talks) {
    await storage.upsert(nowDoc({ id: talk.id, collection: 'toolbox_talks', data: talk, syncStatus: 'pending' }));
  }

  const incidents: Incident[] = [
    {
      id: 'inc-ladder',
      jobsiteId: jobId,
      kind: 'near_miss',
      severity: 'medium',
      title: 'Unsecured ladder',
      description: 'Ladder walked at grid D-8. Nobody hurt. Footed and tied off after.',
      locationNote: 'Level 2 corridor, grid D-8',
      rootCauses: ['procedure', 'housekeeping'],
      involvedIds: jamal ? [jamal.id] : [],
      photoUris: [],
      createdAt: Date.now() - 5_000_000,
    },
  ];
  for (const incident of incidents) {
    await storage.upsert(nowDoc({ id: incident.id, collection: 'incidents', data: incident, syncStatus: 'pending' }));
  }

  const drawings: Drawing[] = [
    {
      id: 'dwg-a101-r2',
      jobsiteId: jobId,
      discipline: 'arch',
      sheetNumber: 'A-101',
      title: 'Level 2 floor plan',
      revision: '2',
      issuedDate: addDaysISO(today, -40),
      current: false,
      supersedesId: null,
      linkHint: 'Level 2',
      markup: [],
      createdAt: Date.now() - 40 * 86_400_000,
    },
    {
      id: 'dwg-a101-r3',
      jobsiteId: jobId,
      discipline: 'arch',
      sheetNumber: 'A-101',
      title: 'Level 2 floor plan',
      revision: '3',
      issuedDate: addDaysISO(today, -6),
      current: true,
      supersedesId: 'dwg-a101-r2',
      linkHint: 'Level 2',
      markup: [],
      createdAt: Date.now() - 6 * 86_400_000,
    },
    {
      id: 'dwg-s201',
      jobsiteId: jobId,
      discipline: 'struct',
      sheetNumber: 'S-201',
      title: 'Dock ramp and slab edge',
      revision: '1',
      issuedDate: addDaysISO(today, -20),
      current: true,
      supersedesId: null,
      linkHint: 'Dock',
      markup: [],
      createdAt: Date.now() - 20 * 86_400_000,
    },
    {
      id: 'dwg-e301',
      jobsiteId: jobId,
      discipline: 'mep',
      sheetNumber: 'E-301',
      title: 'Lighting plan rooms 204–208',
      revision: '4',
      issuedDate: addDaysISO(today, -3),
      current: true,
      supersedesId: null,
      linkHint: '204',
      markup: [],
      createdAt: Date.now() - 3 * 86_400_000,
    },
  ];
  for (const drawing of drawings) {
    await storage.upsert(nowDoc({ id: drawing.id, collection: 'drawings', data: drawing, syncStatus: 'pending' }));
  }

  const certs: Certification[] = [];
  if (marcus) {
    certs.push({
      id: 'cert-marcus-30',
      jobsiteId: jobId,
      crewId: marcus.id,
      crewName: marcus.name,
      kind: 'osha30',
      number: 'WAH-4412',
      expiresOn: addDaysISO(today, 280),
      photoUri: null,
    });
  }
  if (ana) {
    certs.push({
      id: 'cert-ana-lift',
      jobsiteId: jobId,
      crewId: ana.id,
      crewName: ana.name,
      kind: 'lift',
      number: 'LIFT-88',
      expiresOn: addDaysISO(today, 18),
      photoUri: null,
    });
  }
  if (jamal) {
    certs.push({
      id: 'cert-jamal-10',
      jobsiteId: jobId,
      crewId: jamal.id,
      crewName: jamal.name,
      kind: 'osha10',
      number: 'WHMIS-9921',
      expiresOn: addDaysISO(today, 210),
      photoUri: null,
    });
  }
  if (priya) {
    certs.push({
      id: 'cert-priya-lic',
      jobsiteId: jobId,
      crewId: priya.id,
      crewName: priya.name,
      kind: 'license',
      number: 'EL-20419',
      expiresOn: addDaysISO(today, 14),
      photoUri: null,
    });
  }
  if (chris) {
    certs.push({
      id: 'cert-chris-aid',
      jobsiteId: jobId,
      crewId: chris.id,
      crewName: chris.name,
      kind: 'first_aid',
      number: 'FA-17',
      expiresOn: addDaysISO(today, -44),
      photoUri: null,
    });
  }
  for (const cert of certs) {
    await storage.upsert(nowDoc({ id: cert.id, collection: 'certifications', data: cert, syncStatus: 'pending' }));
  }

  const pay: PayApp = {
    id: 'pa-101',
    jobsiteId: jobId,
    number: 'PA-101',
    company: 'Northframe',
    lineTitle: 'Framing 100%',
    percentComplete: 80,
    amount: 24000,
    photoUris: [],
    status: 'submitted',
    createdAt: Date.now() - 86_400_000,
  };
  await storage.upsert(nowDoc({ id: pay.id, collection: 'pay_apps', data: pay, syncStatus: 'pending' }));
}

const SITE_A = {
  address: '4200 Industrial Drive, Hamilton, ON L8L 4Y7',
  lat: 43.2557,
  lng: -79.8711,
};

const SITE_B = {
  address: '4210 Industrial Drive, Hamilton, ON L8L 4Y8',
  lat: 43.2564,
  lng: -79.8698,
};

async function patchCanadaUnitsIfNeeded() {
  const storage = getStorage();
  const sites = await storage.getAll<Jobsite>('jobsites');
  for (const doc of sites) {
    const next =
      doc.data.id === DEMO_JOBSITE_B || doc.data.name.includes('Building B')
        ? { ...doc.data, ...SITE_B }
        : doc.data.id === DEMO_JOBSITE_ID || doc.data.name.includes('Building A')
          ? { ...doc.data, ...SITE_A }
          : doc.data.address.includes(', ON')
            ? doc.data
            : { ...doc.data, lat: SITE_A.lat, lng: SITE_A.lng, address: `${doc.data.address}, Hamilton, ON` };
    if (next.address !== doc.data.address || next.lat !== doc.data.lat || next.lng !== doc.data.lng) {
      await storage.upsert(nowDoc({ id: doc.id, collection: 'jobsites', data: next, syncStatus: doc.syncStatus }));
    }
  }

  const certs = await storage.getAll<Certification>('certifications');
  for (const doc of certs) {
    const number = doc.data.number
      .replace(/^OSHA-30/, 'WAH')
      .replace(/^OSHA-10/, 'WHMIS');
    if (number !== doc.data.number) {
      await storage.upsert(
        nowDoc({ id: doc.id, collection: 'certifications', data: { ...doc.data, number }, syncStatus: doc.syncStatus }),
      );
    }
  }

  const talks = await storage.getAll<ToolboxTalk>('toolbox_talks');
  for (const doc of talks) {
    const points = doc.data.points.map((point) =>
      point.replace('above 6 ft', 'above 3 m').replace('above 10 ft', 'above 3 m'),
    );
    if (points.some((point, index) => point !== doc.data.points[index])) {
      await storage.upsert(
        nowDoc({ id: doc.id, collection: 'toolbox_talks', data: { ...doc.data, points }, syncStatus: doc.syncStatus }),
      );
    }
  }

  const settingsDoc = await storage.get<AppSettings>('app');
  if (settingsDoc?.data.unitsVersion === UNITS_VERSION) return;

  const logs = await storage.getAll<DailyLog & { tempF?: number }>('daily_logs');
  for (const doc of logs) {
    const tempC = coerceTempC(doc.data);
    if (tempC !== (doc.data as DailyLog).tempC) {
      await storage.upsert(
        nowDoc({
          id: doc.id,
          collection: 'daily_logs',
          data: { ...doc.data, tempC },
          syncStatus: doc.syncStatus,
        }),
      );
    }
  }

  const assets = await storage.getAll<{
    fuelUsedLitres?: number;
    fuelUsedGallons?: number;
    meterUnit: 'hours' | 'km' | 'miles';
    hourMeter: number;
    lastOilHours: number;
  } & Omit<Asset, 'fuelUsedLitres' | 'meterUnit'>>('assets');
  for (const doc of assets) {
    const raw = doc.data;
    const fuelUsedLitres = coerceFuelL(raw);
    const wasMiles = (raw.meterUnit as string) === 'miles';
    const next: Asset = {
      ...raw,
      meterUnit: raw.meterUnit === 'hours' ? 'hours' : 'km',
      hourMeter: wasMiles ? Math.round(raw.hourMeter * MI_TO_KM) : raw.hourMeter,
      lastOilHours: wasMiles ? Math.round(raw.lastOilHours * MI_TO_KM) : raw.lastOilHours,
      fuelUsedLitres,
    };
    await storage.upsert(nowDoc({ id: doc.id, collection: 'assets', data: next, syncStatus: doc.syncStatus }));
  }

  if (settingsDoc) {
    await storage.upsert(
      nowDoc({
        id: settingsDoc.id,
        collection: 'settings',
        data: { ...settingsDoc.data, unitsVersion: UNITS_VERSION },
        syncStatus: settingsDoc.syncStatus,
      }),
    );
  }
}
