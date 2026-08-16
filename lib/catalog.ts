import type { DelayType, PunchPriority, PunchStatus, Trade, WeatherCondition, WorkOrderStatus, RootCause, CertKind, DrawingDiscipline } from './types';

export const WEATHER: { id: WeatherCondition; label: string }[] = [
  { id: 'clear', label: 'Clear' },
  { id: 'cloudy', label: 'Cloudy' },
  { id: 'rain', label: 'Rain' },
  { id: 'snow', label: 'Snow' },
  { id: 'wind', label: 'High wind' },
  { id: 'heat', label: 'Extreme heat' },
  { id: 'cold', label: 'Extreme cold' },
];

export const WORK_CHIPS = [
  'Excavation',
  'Formwork',
  'Concrete pour',
  'Framing',
  'MEP rough-in',
  'Drywall',
  'Roofing',
  'Site cleanup',
  'Inspections',
  'Deliveries',
];

export const DELAYS: { id: DelayType; label: string }[] = [
  { id: 'weather_hold', label: 'Weather hold' },
  { id: 'trade_conflict', label: 'Trade conflict' },
  { id: 'material_wait', label: 'Material wait' },
  { id: 'equipment_down', label: 'Equipment down' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'access', label: 'Access / laydown' },
  { id: 'other', label: 'Other' },
];

export const TRADES: { id: Trade; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'sitework', label: 'Sitework' },
  { id: 'concrete', label: 'Concrete' },
  { id: 'framing', label: 'Framing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'drywall', label: 'Drywall' },
  { id: 'roofing', label: 'Roofing' },
  { id: 'finishes', label: 'Finishes' },
];

export const PRIORITIES: { id: PunchPriority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
];

export const PUNCH_STATUS: { id: PunchStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'ready_for_review', label: 'Ready for review' },
  { id: 'closed', label: 'Closed' },
];

export const VISITOR_PURPOSES = ['Owner walk', 'Inspector', 'Delivery', 'Architect', 'Vendor', 'Other'];

export function tradeLabel(id: Trade) {
  return TRADES.find((t) => t.id === id)?.label ?? id;
}

export function delayLabel(id: DelayType) {
  return DELAYS.find((t) => t.id === id)?.label ?? id;
}

export function weatherLabel(id: WeatherCondition) {
  return WEATHER.find((t) => t.id === id)?.label ?? id;
}

export function priorityLabel(id: PunchPriority) {
  return PRIORITIES.find((t) => t.id === id)?.label ?? id;
}

export function statusLabel(id: PunchStatus) {
  return PUNCH_STATUS.find((t) => t.id === id)?.label ?? id;
}

export const HEAVY_INSPECT = [
  'Circle check / walk-around',
  'Tracks or tires',
  'Engine oil level',
  'Hydraulic fluid',
  'Coolant',
  'Leaks under machine',
  'Safety guards in place',
  'Lights and backup alarm',
  'Seat belt / ROPS',
  'Attachments locked',
];

export const TRUCK_INSPECT = [
  'Lights and reflectors',
  'Tires and lug nuts',
  'Engine oil / coolant',
  'Backup alarm',
  'Load and tools secure',
];

export const TOOL_INSPECT = [
  'Guard / bit condition',
  'Cord or battery',
  'Housing cracks',
  'Test run',
];

export const CHECKOUT_LOCATIONS = ['This jobsite', 'Mechanic truck', 'Yard', 'Another crew truck'];

export const COST_CODES = [
  { code: '01-000', name: 'Labor', unit: 'hr', unitCost: 85 },
  { code: '03-300', name: 'Concrete', unit: 'CY', unitCost: 185 },
  { code: '06-100', name: 'Framing lumber', unit: 'LF', unitCost: 3.25 },
  { code: '09-290', name: 'Drywall', unit: 'sheet', unitCost: 14.5 },
  { code: '31-200', name: 'Aggregate', unit: 'CY', unitCost: 42 },
  { code: '02-200', name: 'Fuel / misc', unit: 'ea', unitCost: 1 },
] as const;

export const VENDORS = ['ABC Lumber', 'Home Depot', 'Ready-Mix Co', 'Fuel stop', 'Sunbelt Rentals', 'Electrical supply'];

export const CO_TITLES = [
  'Extra concrete',
  'Added walls',
  'Owner upgrade',
  'Unforeseen condition',
  'Overtime / acceleration',
];

export const TAKEOFF_KINDS: { id: 'concrete' | 'aggregate' | 'sf' | 'framing' | 'drywall'; label: string }[] = [
  { id: 'concrete', label: 'Concrete CY' },
  { id: 'aggregate', label: 'Aggregate CY' },
  { id: 'sf', label: 'Square feet' },
  { id: 'framing', label: 'Framing LF' },
  { id: 'drywall', label: 'Drywall sheets' },
];

export const DIM_FT = [8, 10, 12, 16, 20, 24, 30, 40, 50, 60];
export const SLAB_IN = [4, 5, 6, 8, 10, 12];
export const WASTE_PCT = [0, 5, 10, 15];
export const LABOR_RATE = 85;

export function costCodeName(code: string) {
  return COST_CODES.find((item) => item.code === code)?.name ?? code;
}

export const TASK_CODES = ['General', 'Sitework', 'Concrete', 'Framing', 'MEP', 'Cleanup'];

export const SHIFT_WINDOWS = [
  { id: 'full', label: '7–3', startHour: 7, endHour: 15 },
  { id: 'long', label: '6–4', startHour: 6, endHour: 16 },
  { id: 'ot', label: '6–6', startHour: 6, endHour: 18 },
  { id: 'am', label: '6–12', startHour: 6, endHour: 12 },
  { id: 'pm', label: '12–6', startHour: 12, endHour: 18 },
];

export const GANTT_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export const WORK_ORDER_STATUS: { id: WorkOrderStatus; label: string }[] = [
  { id: 'offered', label: 'Offered' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'declined', label: 'Declined' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'complete', label: 'Complete' },
];

export const DELIVERY_NOTES = [
  'Material on dock',
  'Dumpster dropped',
  'Lift on site',
  'Inspection passed',
  'Need layout',
];

export const WO_TITLES = [
  'Level 2 electrical rough',
  'Second-floor walls',
  'Slab pour standby',
  'MEP sleeves',
  'Site cleanup',
];

export const SUB_COMPANIES = ['Volt & Co', 'Northframe', 'Ready-Mix Co', 'FieldOps GC'];

export function workOrderStatusLabel(id: WorkOrderStatus) {
  return WORK_ORDER_STATUS.find((item) => item.id === id)?.label ?? id;
}

export const TOOLBOX_TOPICS = [
  {
    id: 'fall',
    title: 'Fall protection',
    points: ['Harness on above 3 m', 'Inspect lanyards before the first tie-off', 'Tie off before stepping off the deck'],
  },
  {
    id: 'silica',
    title: 'Silica / dust',
    points: ['Water on the cut', 'Respirator if dry cutting', 'Keep bystanders upwind'],
  },
  {
    id: 'heat',
    title: 'Heat illness',
    points: ['Water every 20 minutes', 'Shade on the break', 'Buddy check for dizziness'],
  },
  {
    id: 'ladder',
    title: 'Ladders',
    points: ['3 points of contact', 'Do not stand on the top cap', 'Foot the ladder on firm ground'],
  },
  {
    id: 'caught',
    title: 'Caught-between',
    points: ['Stay out of the swing radius', 'Chock parked iron', 'Spotter on the backup'],
  },
  {
    id: 'elec',
    title: 'Electrical',
    points: ['GFCI on temp power', 'Lock-out before opening a panel', 'No damaged cords'],
  },
];

export const INCIDENT_TITLES = [
  'Unsecured ladder',
  'Near miss — swing radius',
  'Trip on debris',
  'Pinch on material',
  'Heat stress',
];

export const ROOT_CAUSES: { id: RootCause; label: string }[] = [
  { id: 'housekeeping', label: 'Housekeeping' },
  { id: 'ppe', label: 'PPE' },
  { id: 'procedure', label: 'Procedure' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'communication', label: 'Communication' },
  { id: 'other', label: 'Other' },
];

export const CERT_KINDS: { id: CertKind; label: string }[] = [
  { id: 'osha10', label: 'WHMIS' },
  { id: 'osha30', label: 'Working at Heights' },
  { id: 'first_aid', label: 'First aid' },
  { id: 'lift', label: 'EWP / zoom boom' },
  { id: 'license', label: 'Trade licence' },
  { id: 'insurance', label: 'WSIB / insurance' },
];

export const DRAWING_DISCIPLINES: { id: DrawingDiscipline; label: string }[] = [
  { id: 'arch', label: 'Architectural' },
  { id: 'struct', label: 'Structural' },
  { id: 'mep', label: 'MEP' },
  { id: 'civil', label: 'Civil' },
];

export function certKindLabel(id: CertKind) {
  return CERT_KINDS.find((item) => item.id === id)?.label ?? id;
}

export function rootCauseLabel(id: RootCause) {
  return ROOT_CAUSES.find((item) => item.id === id)?.label ?? id;
}

export function disciplineLabel(id: DrawingDiscipline) {
  return DRAWING_DISCIPLINES.find((item) => item.id === id)?.label ?? id;
}
