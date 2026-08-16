import type { FeatureId, TenantConfig, UserRole } from './tenant';

const ROLE_FEATURES: Record<UserRole, FeatureId[]> = {
  foreman: [
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
  ],
  employee: [
    'today',
    'logs',
    'punch',
    'photos',
    'equipment',
    'labor_clock',
    'safety',
    'sync',
    'voice_log',
    'cv_inspect',
    'schedule_weather',
    'ble_gate',
  ],
  vendor: ['today', 'photos', 'work_orders', 'ocr', 'billing', 'blueprint_diff', 'sync'],
};

export function canAccess(tenant: TenantConfig, role: UserRole, feature: FeatureId) {
  return tenant.enabledFeatures.includes(feature) && ROLE_FEATURES[role].includes(feature);
}
