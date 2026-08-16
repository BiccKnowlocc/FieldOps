import { TENANTS, tenantByCode, type UserRole } from './tenant';
import type { Session } from './session';
import type { StoredDoc } from './types';

function apiBase() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:8787';
    return `${window.location.origin}/api`;
  }
  return '';
}

const BASE = apiBase();

export const DEMO_USERS: { name: string; pin: string; role: UserRole; userId: string }[] = [
  { name: 'Nick', pin: '4412', role: 'foreman', userId: 'user-nick' },
  { name: 'Ana Ruiz', pin: '2200', role: 'employee', userId: 'user-ana' },
  { name: 'Volt & Co', pin: '3300', role: 'vendor', userId: 'user-volt' },
];

export function apiConfigured() {
  return BASE.length > 0;
}

export async function loginRemote(input: { companyCode: string; role: UserRole; pin: string }): Promise<Session | null> {
  const tenant = tenantByCode(input.companyCode);
  if (!tenant) return null;

  if (!BASE) {
    const user = DEMO_USERS.find((item) => item.role === input.role && item.pin === input.pin);
    if (!user) return null;
    return {
      userId: user.userId,
      name: user.name,
      role: user.role,
      tenantId: tenant.id,
      companyCode: tenant.code,
      pin: input.pin,
    };
  }

  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    return (await res.json()) as Session;
  } catch {
    const user = DEMO_USERS.find((item) => item.role === input.role && item.pin === input.pin);
    if (!user) return null;
    return {
      userId: user.userId,
      name: user.name,
      role: user.role,
      tenantId: tenant.id,
      companyCode: tenant.code,
      pin: input.pin,
    };
  }
}

export async function pushDocsToApi(tenantId: string, docs: StoredDoc[]) {
  if (!BASE || docs.length === 0) return { pushed: 0 };
  try {
    const res = await fetch(`${BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, docs }),
    });
    if (!res.ok) return { pushed: 0 };
    const json = (await res.json()) as { pushed: number };
    return json;
  } catch {
    return { pushed: 0 };
  }
}

export function listTenants() {
  return TENANTS;
}
