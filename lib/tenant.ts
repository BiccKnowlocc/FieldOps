import { colors as defaultColors } from '@/constants/theme';

export type UserRole = 'foreman' | 'employee' | 'vendor';

export type FeatureId =
  | 'today'
  | 'logs'
  | 'punch'
  | 'photos'
  | 'equipment'
  | 'costing'
  | 'labor'
  | 'labor_clock'
  | 'safety'
  | 'work_orders'
  | 'sync'
  | 'voice_log'
  | 'blueprint_diff'
  | 'telematics'
  | 'ocr'
  | 'bim'
  | 'cv_inspect'
  | 'schedule_weather'
  | 'drone'
  | 'ble_gate'
  | 'billing';

export type BrandColors = Partial<typeof defaultColors>;

export type TenantConfig = {
  id: string;
  code: string;
  companyName: string;
  logoText: string;
  logoUri: string | null;
  mongoDatabase: string;
  colors: BrandColors;
  enabledFeatures: FeatureId[];
};

const ALL_FEATURES: FeatureId[] = [
  'today',
  'logs',
  'punch',
  'photos',
  'equipment',
  'costing',
  'labor',
  'labor_clock',
  'safety',
  'work_orders',
  'sync',
  'voice_log',
  'blueprint_diff',
  'telematics',
  'ocr',
  'bim',
  'cv_inspect',
  'schedule_weather',
  'drone',
  'ble_gate',
  'billing',
];

export const TENANTS: TenantConfig[] = [
  {
    id: 'tenant-riverside',
    code: 'RIVERSIDE',
    companyName: 'Riverside GC',
    logoText: 'FieldOps',
    logoUri: null,
    mongoDatabase: 'fieldops_riverside',
    colors: {},
    enabledFeatures: ALL_FEATURES,
  },
  {
    id: 'tenant-northline',
    code: 'NORTHLINE',
    companyName: 'Northline Civil',
    logoText: 'Northline',
    logoUri: null,
    mongoDatabase: 'fieldops_northline',
    colors: {
      navy: '#141414',
      navyMid: '#2A2A2A',
      orange: '#3D8B6E',
      orangePress: '#2F6F4E',
      paper: '#F3F4F1',
    },
    enabledFeatures: [
      'today',
      'logs',
      'punch',
      'photos',
      'equipment',
      'labor',
      'labor_clock',
      'safety',
      'work_orders',
      'sync',
      'voice_log',
      'ocr',
      'cv_inspect',
      'schedule_weather',
      'ble_gate',
      'billing',
    ],
  },
];

export const DEFAULT_TENANT = TENANTS[0];

export function tenantByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  return TENANTS.find((tenant) => tenant.code === normalized) ?? null;
}

export function mergeColors(tenant: TenantConfig) {
  return { ...defaultColors, ...tenant.colors };
}
