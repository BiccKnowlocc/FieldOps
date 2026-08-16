/** Canadian field units. Building takeoff stays imperial (ft / in / CY) as trades still use it. */
export const LOCALE = 'en-CA';
export const UNITS_VERSION = 3;
export const GAL_TO_L = 3.785;
export const MI_TO_KM = 1.609;

export function formatM(meters: number) {
  return `${Math.round(meters)} m`;
}

export function formatAccuracyM(accuracyM: number | null) {
  if (accuracyM == null) return null;
  return `±${Math.round(accuracyM)} m`;
}

export function coerceTempC(data: { tempC?: number; tempF?: number }) {
  if (typeof data.tempC === 'number') return data.tempC;
  if (typeof data.tempF === 'number') {
    return data.tempF > 45 ? Math.round(((data.tempF - 32) * 5) / 9) : data.tempF;
  }
  return 20;
}

export function coerceFuelL(data: { fuelUsedLitres?: number; fuelUsedGallons?: number }) {
  if (typeof data.fuelUsedLitres === 'number') return data.fuelUsedLitres;
  if (typeof data.fuelUsedGallons === 'number') return Math.round(data.fuelUsedGallons * GAL_TO_L);
  return 0;
}
