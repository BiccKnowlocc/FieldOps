import type { Asset } from './types';

export type Dtc = { code: string; severity: 'info' | 'warn' | 'stop'; description: string };

export type CanFrame = {
  assetId: string;
  hoursAdded: number;
  idleAdded: number;
  fuelAdded: number;
  dtc: Dtc | null;
};

export const DEMO_CAN: CanFrame[] = [
  { assetId: 'asset-ex-12', hoursAdded: 4.2, idleAdded: 1.1, fuelAdded: 68, dtc: null },
  {
    assetId: 'asset-ld-44',
    hoursAdded: 6.0,
    idleAdded: 2.4,
    fuelAdded: 83,
    dtc: { code: 'SPN 94 FMI 1', severity: 'warn', description: 'Fuel pressure low — check feed' },
  },
  { assetId: 'asset-dz-51', hoursAdded: 3.1, idleAdded: 0.4, fuelAdded: 42, dtc: null },
  {
    assetId: 'asset-gn-50',
    hoursAdded: 0,
    idleAdded: 0,
    fuelAdded: 0,
    dtc: { code: 'SPN 100 FMI 1', severity: 'stop', description: 'Oil pressure — do not run' },
  },
];

export function applyCanFrame(asset: Asset, frame: CanFrame): Asset {
  return {
    ...asset,
    hourMeter: Math.round((asset.hourMeter + frame.hoursAdded) * 10) / 10,
    idleHours: Math.round((asset.idleHours + frame.idleAdded) * 10) / 10,
    fuelUsedLitres: Math.round((asset.fuelUsedLitres + frame.fuelAdded) * 10) / 10,
    status: frame.dtc?.severity === 'stop' ? 'down' : asset.status,
  };
}

export function utilization(hours: number, idle: number) {
  const total = hours + idle;
  if (total <= 0) return 0;
  return Math.round((hours / total) * 100);
}
