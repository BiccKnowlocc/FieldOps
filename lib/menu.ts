import type { FeatureId } from './tenant';

export type MenuItem = {
  id: string;
  label: string;
  href: string;
  feature: FeatureId;
};

export type MenuCategory = {
  id: string;
  label: string;
  items: MenuItem[];
};

export const MENU: MenuCategory[] = [
  {
    id: 'field',
    label: 'Field',
    items: [
      { id: 'today', label: 'Today', href: '/', feature: 'today' },
      { id: 'logs', label: 'Daily logs', href: '/logs', feature: 'logs' },
      { id: 'voice', label: 'Voice log', href: '/intel/voice', feature: 'voice_log' },
      { id: 'punch', label: 'Punch list', href: '/punch', feature: 'punch' },
      { id: 'photos', label: 'Photos', href: '/capture', feature: 'photos' },
    ],
  },
  {
    id: 'equipment',
    label: 'Equipment',
    items: [
      { id: 'fleet', label: 'Fleet & tools', href: '/equipment', feature: 'equipment' },
      { id: 'scan', label: 'Scan / check-out', href: '/scan', feature: 'equipment' },
      { id: 'telematics', label: 'Telematics / CAN', href: '/intel/telematics', feature: 'telematics' },
      { id: 'gate', label: 'BLE / NFC gate', href: '/intel/gate', feature: 'ble_gate' },
    ],
  },
  {
    id: 'cost',
    label: 'Cost & billing',
    items: [
      { id: 'costing', label: 'Job cost', href: '/costing', feature: 'costing' },
      { id: 'takeoff', label: 'Takeoff', href: '/takeoff', feature: 'costing' },
      { id: 'ocr', label: 'Ticket OCR', href: '/intel/ocr', feature: 'ocr' },
      { id: 'billing', label: 'Progress billing', href: '/intel/billing', feature: 'billing' },
    ],
  },
  {
    id: 'labor',
    label: 'Labor',
    items: [
      { id: 'labor', label: 'Clock & dispatch', href: '/labor', feature: 'labor_clock' },
      { id: 'subs', label: 'Work orders', href: '/labor', feature: 'work_orders' },
    ],
  },
  {
    id: 'safety',
    label: 'Safety & drawings',
    items: [
      { id: 'safety', label: 'Talks & certs', href: '/safety', feature: 'safety' },
      { id: 'diff', label: 'Revision diff', href: '/intel/diff', feature: 'blueprint_diff' },
      { id: 'bim', label: 'BIM / IFC viewer', href: '/intel/bim', feature: 'bim' },
      { id: 'vision', label: 'CV inspect', href: '/intel/vision', feature: 'cv_inspect' },
    ],
  },
  {
    id: 'plan',
    label: 'Plan & earthwork',
    items: [
      { id: 'weather', label: 'Weather / CPM', href: '/intel/weather', feature: 'schedule_weather' },
      { id: 'drone', label: 'Drone volumes', href: '/intel/drone', feature: 'drone' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [{ id: 'sync', label: 'Jobsite & sync', href: '/more', feature: 'sync' }],
  },
];
