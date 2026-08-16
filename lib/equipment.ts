import { HEAVY_INSPECT, TOOL_INSPECT, TRUCK_INSPECT } from './catalog';
import type { Asset, AssetKind, AssetStatus, InspectionItem } from './types';

export function oilInterval(asset: Asset) {
  if (asset.kind === 'tool') return null;
  if (asset.kind === 'truck') return 8000;
  return 250;
}

export function hydInterval(asset: Asset) {
  if (asset.kind !== 'heavy') return null;
  return 500;
}

export function oilDueAt(asset: Asset) {
  const interval = oilInterval(asset);
  if (interval == null) return null;
  return asset.lastOilHours + interval;
}

export function hydDueAt(asset: Asset) {
  const interval = hydInterval(asset);
  if (interval == null) return null;
  return asset.lastHydHours + interval;
}

export function hoursUntil(dueAt: number | null, meter: number) {
  if (dueAt == null) return null;
  return dueAt - meter;
}

export type ServiceLevel = 'ok' | 'soon' | 'overdue';

export function serviceLevel(asset: Asset): ServiceLevel {
  const oil = hoursUntil(oilDueAt(asset), asset.hourMeter);
  const hyd = hoursUntil(hydDueAt(asset), asset.hourMeter);
  const values = [oil, hyd].filter((v): v is number => v != null);
  if (values.length === 0) return 'ok';
  const min = Math.min(...values);
  if (min <= 0) return 'overdue';
  if (min <= 25) return 'soon';
  return 'ok';
}

export function meterLabel(asset: Asset) {
  return asset.meterUnit === 'km' ? 'km' : 'hr';
}

export function kindLabel(kind: AssetKind) {
  if (kind === 'heavy') return 'Heavy';
  if (kind === 'truck') return 'Truck';
  return 'Tool';
}

export function assetStatusLabel(status: AssetStatus) {
  if (status === 'checked_out') return 'Checked out';
  if (status === 'down') return 'Down';
  if (status === 'in_service') return 'In service';
  return 'Available';
}

export function inspectTemplate(kind: AssetKind): InspectionItem[] {
  const labels = kind === 'truck' ? TRUCK_INSPECT : kind === 'tool' ? TOOL_INSPECT : HEAVY_INSPECT;
  return labels.map((label, index) => ({ id: `i${index}`, label, ok: null }));
}

export function serviceSummary(asset: Asset) {
  const oil = hoursUntil(oilDueAt(asset), asset.hourMeter);
  const hyd = hoursUntil(hydDueAt(asset), asset.hourMeter);
  const bits: string[] = [];
  if (oil != null) bits.push(oil <= 0 ? `Oil overdue ${Math.abs(oil)} ${meterLabel(asset)}` : `Oil in ${oil} ${meterLabel(asset)}`);
  if (hyd != null) bits.push(hyd <= 0 ? `Hyd overdue ${Math.abs(hyd)} hr` : `Hyd in ${hyd} hr`);
  return bits.join(' · ') || 'No engine service cycle';
}

export function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '-');
}

export function assetMatchesCode(asset: Asset, raw: string) {
  const code = normalizeCode(raw);
  return (
    normalizeCode(asset.qrCode) === code ||
    normalizeCode(asset.unitNumber) === code ||
    normalizeCode(asset.id) === code
  );
}
