import { Platform } from 'react-native';

import type { UserRole } from './tenant';

const KEY = 'fieldops.session';

export type Session = {
  userId: string;
  name: string;
  role: UserRole;
  tenantId: string;
  companyCode: string;
  pin: string;
};

async function webStore() {
  return {
    get: () => (typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY)),
    set: (value: string) => localStorage.setItem(KEY, value),
    clear: () => localStorage.removeItem(KEY),
  };
}

async function nativeStore() {
  const SecureStore = await import('expo-secure-store');
  return {
    get: () => SecureStore.getItemAsync(KEY),
    set: (value: string) => SecureStore.setItemAsync(KEY, value),
    clear: () => SecureStore.deleteItemAsync(KEY),
  };
}

async function store() {
  return Platform.OS === 'web' ? webStore() : nativeStore();
}

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await (await store()).get();
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session) {
  await (await store()).set(JSON.stringify(session));
}

export async function clearSession() {
  await (await store()).clear();
}
