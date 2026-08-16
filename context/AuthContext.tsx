import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { loginRemote } from '@/lib/api';
import { canAccess } from '@/lib/access';
import { clearSession, loadSession, saveSession, type Session } from '@/lib/session';
import { setSyncTenant } from '@/lib/sync';
import type { FeatureId, UserRole } from '@/lib/tenant';
import { useTenant } from './TenantContext';

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  signIn: (input: { companyCode: string; role: UserRole; pin: string }) => Promise<string | null>;
  signOut: () => Promise<void>;
  can: (feature: FeatureId) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { tenant, setTenantCode } = useTenant();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadSession();
      if (!mounted) return;
      if (stored) {
        setTenantCode(stored.companyCode);
        setSession(stored);
        setSyncTenant(stored.tenantId);
      }
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [setTenantCode]);

  const signIn = useCallback(
    async (input: { companyCode: string; role: UserRole; pin: string }) => {
      const next = await loginRemote(input);
      if (!next) return 'Company code, role, or PIN does not match.';
      setTenantCode(next.companyCode);
      await saveSession(next);
      setSyncTenant(next.tenantId);
      setSession(next);
      return null;
    },
    [setTenantCode],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setSyncTenant(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      signIn,
      signOut,
      can: (feature) => (session ? canAccess(tenant, session.role, feature) : false),
    }),
    [ready, session, signIn, signOut, tenant],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
