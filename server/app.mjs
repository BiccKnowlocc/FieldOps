import cors from 'cors';
import express from 'express';
import { MongoClient } from 'mongodb';

const URI = process.env.MONGODB_URI ?? '';

const TENANTS = [
  { id: 'tenant-riverside', code: 'RIVERSIDE', companyName: 'Riverside GC', logoText: 'FieldOps', mongoDatabase: 'fieldops_riverside', orange: '#E85D04', navy: '#0B1F33' },
  { id: 'tenant-northline', code: 'NORTHLINE', companyName: 'Northline Civil', logoText: 'Northline', mongoDatabase: 'fieldops_northline', orange: '#3D8B6E', navy: '#141414' },
];

const OFFICE_ROLES = new Set(['office', 'foreman']);

const memory = new Map();
let cachedClient = null;

function now() {
  return Date.now();
}

function wrap(collection, data) {
  return {
    id: data.id,
    collection,
    data,
    updatedAt: now(),
    deletedAt: null,
    syncStatus: 'synced',
    lastSyncedAt: now(),
  };
}

function seedTenant(tenant) {
  const jobA = {
    id: 'job-riverside-a',
    name: 'Riverside Warehouse — Building A',
    address: '4200 Industrial Drive, Hamilton, ON L8L 4Y7',
    lat: 43.2557,
    lng: -79.8711,
    geofenceRadiusM: 200,
    status: 'active',
  };
  const jobB = {
    id: 'job-riverside-b',
    name: 'Riverside Warehouse — Building B',
    address: '4210 Industrial Drive, Hamilton, ON L8L 4Y8',
    lat: 43.2564,
    lng: -79.8698,
    geofenceRadiusM: 200,
    status: 'active',
  };
  const crew = [
    { id: 'crew-marcus', jobsiteId: jobA.id, name: 'Marcus Hale', role: 'Foreman', company: tenant.companyName, trade: 'general' },
    { id: 'crew-ana', jobsiteId: jobA.id, name: 'Ana Ruiz', role: 'Operator', company: tenant.companyName, trade: 'sitework' },
    { id: 'crew-jamal', jobsiteId: jobA.id, name: 'Jamal Brooks', role: 'Carpenter', company: 'Northframe', trade: 'framing' },
    { id: 'crew-priya', jobsiteId: jobA.id, name: 'Priya Shah', role: 'Electrician', company: 'Volt & Co', trade: 'electrical' },
    { id: 'crew-chris', jobsiteId: jobA.id, name: 'Chris Nguyen', role: 'Laborer', company: tenant.companyName, trade: 'general' },
  ];
  const users = [
    { id: 'user-nick', userId: 'user-nick', name: 'Nick', pin: '4412', role: 'foreman', tenantId: tenant.id, companyCode: tenant.code, crewId: 'crew-marcus', active: true },
    { id: 'user-ana', userId: 'user-ana', name: 'Ana Ruiz', pin: '2200', role: 'employee', tenantId: tenant.id, companyCode: tenant.code, crewId: 'crew-ana', active: true },
    { id: 'user-volt', userId: 'user-volt', name: 'Volt & Co', pin: '3300', role: 'vendor', tenantId: tenant.id, companyCode: tenant.code, crewId: 'crew-priya', active: true },
    { id: 'user-dana', userId: 'user-dana', name: 'Dana Cole', pin: '5500', role: 'office', tenantId: tenant.id, companyCode: tenant.code, crewId: null, active: true },
    { id: 'user-pat', userId: 'user-pat', name: 'Pat Singh', pin: '6600', role: 'office', tenantId: tenant.id, companyCode: tenant.code, crewId: null, active: true },
  ];
  const assets = [
    { id: 'asset-ex-12', jobsiteId: jobA.id, name: 'CAT 320 Excavator', kind: 'heavy', make: 'Caterpillar', model: '320', unitNumber: 'EX-12', qrCode: 'FO-EX12', meterUnit: 'hours', hourMeter: 238, idleHours: 41, fuelUsedLitres: 3255, lastOilHours: 0, lastHydHours: 0, status: 'available', assignedTo: null, assignedLocation: 'This jobsite' },
    { id: 'asset-ld-44', jobsiteId: jobA.id, name: 'Deere 644K Loader', kind: 'heavy', make: 'John Deere', model: '644K', unitNumber: 'LD-44', qrCode: 'FO-LD44', meterUnit: 'hours', hourMeter: 518, idleHours: 90, fuelUsedLitres: 5375, lastOilHours: 250, lastHydHours: 0, status: 'checked_out', assignedTo: 'Ana Ruiz', assignedLocation: 'This jobsite' },
    { id: 'asset-dz-51', jobsiteId: jobA.id, name: 'Komatsu D51 Dozer', kind: 'heavy', make: 'Komatsu', model: 'D51', unitNumber: 'DZ-51', qrCode: 'FO-DZ51', meterUnit: 'hours', hourMeter: 180, idleHours: 22, fuelUsedLitres: 1552, lastOilHours: 0, lastHydHours: 0, status: 'available', assignedTo: null, assignedLocation: 'This jobsite' },
    { id: 'asset-tl-88', jobsiteId: jobA.id, name: 'Milwaukee SDS Max', kind: 'tool', make: 'Milwaukee', model: 'SDS Max', unitNumber: 'TL-88', qrCode: 'FO-TL88', meterUnit: 'hours', hourMeter: 0, idleHours: 0, fuelUsedLitres: 0, lastOilHours: 0, lastHydHours: 0, status: 'checked_out', assignedTo: 'Jamal Brooks', assignedLocation: 'This jobsite' },
    { id: 'asset-tk-350', jobsiteId: jobA.id, name: 'Ford F-350 Mechanic', kind: 'truck', make: 'Ford', model: 'F-350', unitNumber: 'TK-350', qrCode: 'FO-TK350', meterUnit: 'km', hourMeter: 66355, idleHours: 0, fuelUsedLitres: 795, lastOilHours: 61142, lastHydHours: 0, status: 'available', assignedTo: null, assignedLocation: 'Yard' },
    { id: 'asset-gn-50', jobsiteId: jobA.id, name: 'Onan 50kW Generator', kind: 'heavy', make: 'Onan', model: '50kW', unitNumber: 'GN-50', qrCode: 'FO-GN50', meterUnit: 'hours', hourMeter: 249, idleHours: 12, fuelUsedLitres: 681, lastOilHours: 0, lastHydHours: 0, status: 'down', assignedTo: null, assignedLocation: 'This jobsite' },
  ];
  const certs = [
    { id: 'cert-marcus-30', jobsiteId: jobA.id, crewId: 'crew-marcus', crewName: 'Marcus Hale', kind: 'osha30', number: 'WAH-4412', expiresOn: '2027-05-21', photoUri: null },
    { id: 'cert-ana-lift', jobsiteId: jobA.id, crewId: 'crew-ana', crewName: 'Ana Ruiz', kind: 'lift', number: 'LIFT-88', expiresOn: '2026-09-01', photoUri: null },
    { id: 'cert-jamal-10', jobsiteId: jobA.id, crewId: 'crew-jamal', crewName: 'Jamal Brooks', kind: 'osha10', number: 'WHMIS-9921', expiresOn: '2027-03-12', photoUri: null },
    { id: 'cert-priya-lic', jobsiteId: jobA.id, crewId: 'crew-priya', crewName: 'Priya Shah', kind: 'license', number: 'EL-20419', expiresOn: '2026-08-28', photoUri: null },
    { id: 'cert-chris-aid', jobsiteId: jobA.id, crewId: 'crew-chris', crewName: 'Chris Nguyen', kind: 'first_aid', number: 'FA-17', expiresOn: '2026-07-01', photoUri: null },
  ];
  const company = {
    id: 'company',
    code: tenant.code,
    companyName: tenant.companyName,
    logoText: tenant.logoText,
    navy: tenant.navy,
    orange: tenant.orange,
    enabledModules: ['field', 'equipment', 'labor', 'safety', 'costing'],
  };

  return {
    jobsites: [jobA, jobB].map((item) => wrap('jobsites', item)),
    crew: crew.map((item) => wrap('crew', item)),
    users: users.map((item) => wrap('users', item)),
    assets: assets.map((item) => wrap('assets', item)),
    certifications: certs.map((item) => wrap('certifications', item)),
    company: [wrap('company', company)],
  };
}

function tenantState(tenantId) {
  if (!memory.has(tenantId)) {
    const tenant = TENANTS.find((item) => item.id === tenantId) ?? TENANTS[0];
    memory.set(tenantId, seedTenant(tenant));
  }
  return memory.get(tenantId);
}

async function dbFor(tenantId) {
  const tenant = TENANTS.find((item) => item.id === tenantId);
  const name = tenant?.mongoDatabase ?? 'fieldops_riverside';
  if (!URI) return null;
  if (!cachedClient) {
    cachedClient = new MongoClient(URI);
    await cachedClient.connect();
  }
  return { db: cachedClient.db(name) };
}

function listCollection(state, collection) {
  return (state[collection] ?? []).filter((doc) => !doc.deletedAt);
}

async function readCollection(tenantId, collection) {
  const pair = await dbFor(tenantId);
  if (!pair) return listCollection(tenantState(tenantId), collection);
  const rows = await pair.db.collection(collection).find({ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }).toArray();
  if (rows.length === 0 && collection !== 'daily_logs') {
    return listCollection(tenantState(tenantId), collection);
  }
  return rows;
}

async function writeDoc(tenantId, collection, doc) {
  const next = {
    ...doc,
    collection,
    updatedAt: now(),
    deletedAt: doc.deletedAt ?? null,
    syncStatus: doc.syncStatus ?? 'synced',
    lastSyncedAt: now(),
  };
  const pair = await dbFor(tenantId);
  if (!pair) {
    const state = tenantState(tenantId);
    const list = state[collection] ?? [];
    const index = list.findIndex((item) => item.id === next.id);
    if (index >= 0) list[index] = next;
    else list.push(next);
    state[collection] = list;
    return next;
  }
  await pair.db.collection(collection).updateOne({ id: next.id }, { $set: next }, { upsert: true });
  return next;
}

function mountRoutes(router) {
  router.get('/health', (_req, res) => {
    res.json({ ok: true, mongo: Boolean(URI), office: true });
  });

  router.get('/tenants', (_req, res) => {
    res.json(TENANTS.map(({ mongoDatabase, ...rest }) => rest));
  });

  router.post('/auth/login', async (req, res) => {
    const { companyCode, role, pin, office } = req.body ?? {};
    const tenant = TENANTS.find((item) => item.code === String(companyCode ?? '').toUpperCase());
    if (!tenant) {
      res.status(401).json({ error: 'Unknown company code' });
      return;
    }
    const users = (await readCollection(tenant.id, 'users')).map((doc) => doc.data);
    const user = users.find((item) => {
      if (String(item.pin) !== String(pin)) return false;
      if (item.active === false) return false;
      if (office) return OFFICE_ROLES.has(item.role);
      if (role) return item.role === role;
      return true;
    });
    if (!user) {
      res.status(401).json({ error: 'Invalid company, role, or PIN' });
      return;
    }
    const session = {
      userId: user.userId,
      name: user.name,
      role: user.role,
      tenantId: tenant.id,
      companyCode: tenant.code,
      pin: user.pin,
    };
    res.json(session);
  });

  router.get('/admin/:tenantId/state', async (req, res) => {
    const { tenantId } = req.params;
    const collections = ['jobsites', 'crew', 'users', 'assets', 'certifications', 'company'];
    const state = {};
    for (const collection of collections) {
      state[collection] = await readCollection(tenantId, collection);
    }
    res.json({ tenantId, mongo: Boolean(URI), state });
  });

  router.put('/admin/:tenantId/:collection/:id', async (req, res) => {
    const { tenantId, collection, id } = req.params;
    const body = req.body ?? {};
    const data = body.data ?? body;
    const doc = await writeDoc(tenantId, collection, wrap(collection, { ...data, id }));
    res.json(doc);
  });

  router.delete('/admin/:tenantId/:collection/:id', async (req, res) => {
    const { tenantId, collection, id } = req.params;
    const existing = (await readCollection(tenantId, collection)).find((doc) => doc.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const doc = await writeDoc(tenantId, collection, { ...existing, deletedAt: now() });
    res.json(doc);
  });

  router.post('/sync', async (req, res) => {
    const { tenantId, docs } = req.body ?? {};
    if (!tenantId || !Array.isArray(docs)) {
      res.status(400).json({ error: 'tenantId and docs required' });
      return;
    }
    let pushed = 0;
    for (const doc of docs) {
      await writeDoc(tenantId, doc.collection ?? 'docs', doc);
      pushed += 1;
    }
    res.json({ pushed, mode: URI ? 'mongo' : 'memory' });
  });
}

export function createApp() {
  const app = express();
  const api = express.Router();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '8mb' }));
  mountRoutes(api);
  app.use('/api', api);
  app.use(api);
  return app;
}

export const app = createApp();
