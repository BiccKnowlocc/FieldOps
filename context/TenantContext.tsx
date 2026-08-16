import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_TENANT, mergeColors, tenantByCode, type TenantConfig } from '@/lib/tenant';
import { colors as defaultColors } from '@/constants/theme';

type TenantContextValue = {
  tenant: TenantConfig;
  colors: typeof defaultColors;
  setTenantCode: (code: string) => boolean;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children, initial }: { children: ReactNode; initial?: TenantConfig }) {
  const [tenant, setTenant] = useState<TenantConfig>(initial ?? DEFAULT_TENANT);
  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      colors: mergeColors(tenant),
      setTenantCode: (code: string) => {
        const next = tenantByCode(code);
        if (!next) return false;
        setTenant(next);
        return true;
      },
    }),
    [tenant],
  );
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}

export function useBrand() {
  const { tenant, colors } = useTenant();
  return {
    colors,
    companyName: tenant.companyName,
    logoText: tenant.logoText,
    logoUri: tenant.logoUri,
    tenant,
  };
}
