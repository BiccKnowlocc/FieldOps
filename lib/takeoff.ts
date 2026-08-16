import type { TakeoffKind } from './types';

export function concreteCy(lengthFt: number, widthFt: number, thickIn: number, wastePct: number) {
  const cy = (lengthFt * widthFt * (thickIn / 12)) / 27;
  return round2(cy * (1 + wastePct / 100));
}

export function areaSf(lengthFt: number, widthFt: number) {
  return round2(lengthFt * widthFt);
}

export function framingLf(wallFt: number, heightFt: number, ocIn: number, plates: number) {
  const studs = Math.floor((wallFt * 12) / ocIn) + 1;
  return round2(plates * wallFt + studs * heightFt);
}

export function drywallSheets(lengthFt: number, widthFt: number, wastePct: number) {
  const sf = lengthFt * widthFt * (1 + wastePct / 100);
  return Math.ceil(sf / 32);
}

export function takeoffResult(kind: TakeoffKind, input: {
  lengthFt: number;
  widthFt: number;
  thickIn: number;
  heightFt: number;
  ocIn: number;
  plates: number;
  wastePct: number;
}) {
  if (kind === 'concrete' || kind === 'aggregate') {
    return { qty: concreteCy(input.lengthFt, input.widthFt, input.thickIn, input.wastePct), unit: 'CY' };
  }
  if (kind === 'sf') {
    return { qty: areaSf(input.lengthFt, input.widthFt), unit: 'SF' };
  }
  if (kind === 'framing') {
    return { qty: framingLf(input.lengthFt, input.heightFt, input.ocIn, input.plates), unit: 'LF' };
  }
  return { qty: drywallSheets(input.lengthFt, input.widthFt, input.wastePct), unit: 'sheet' };
}

export function defaultCostCode(kind: TakeoffKind) {
  if (kind === 'concrete') return '03-300';
  if (kind === 'aggregate') return '31-200';
  if (kind === 'framing') return '06-100';
  if (kind === 'drywall') return '09-290';
  return '01-000';
}

export function defaultVendor(kind: TakeoffKind) {
  if (kind === 'concrete') return 'Ready-Mix Co';
  if (kind === 'aggregate') return 'Ready-Mix Co';
  if (kind === 'drywall' || kind === 'framing' || kind === 'sf') return 'ABC Lumber';
  return 'ABC Lumber';
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
