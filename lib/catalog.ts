import type { DelayType, PunchPriority, PunchStatus, Trade, WeatherCondition } from './types';

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
