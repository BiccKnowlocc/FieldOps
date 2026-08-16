import type { TimeEntry } from './types';

const DAY_OT_AFTER = 8;

export function entryHours(entry: TimeEntry, now = Date.now()) {
  const end = entry.clockOut ?? now;
  return Math.max(0, (end - entry.clockIn) / 3_600_000);
}

export function splitOt(hours: number) {
  const regular = Math.min(DAY_OT_AFTER, hours);
  const overtime = Math.max(0, hours - DAY_OT_AFTER);
  return { regular, overtime, total: hours };
}

export function formatHours(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function openEntryFor(entries: TimeEntry[], crewId: string) {
  return entries.find((entry) => entry.crewId === crewId && entry.clockOut == null);
}

export function hourLabel(hour: number) {
  const suffix = hour >= 12 ? 'p' : 'a';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

export function dayHoursFor(entries: TimeEntry[], crewId: string, dayIso: string, now = Date.now()) {
  const [y, m, d] = dayIso.split('-').map(Number);
  const start = new Date(y, m - 1, d).getTime();
  const end = start + 86_400_000;
  return entries
    .filter((entry) => entry.crewId === crewId && entry.clockIn < end && (entry.clockOut ?? now) > start)
    .reduce((sum, entry) => sum + entryHours(entry, now), 0);
}
