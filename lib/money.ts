import { LOCALE } from './units';

export function cad(value: number) {
  return value.toLocaleString(LOCALE, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
}

export function cadExact(value: number) {
  return value.toLocaleString(LOCALE, { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 });
}

/** @deprecated Use cad — kept so existing screens keep compiling. */
export const usd = cad;
/** @deprecated Use cadExact */
export const usdExact = cadExact;

export function parseAmountsFromText(text: string) {
  const matches = [...text.matchAll(/\$?\s*(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)/g)];
  const values = matches
    .map((match) => Number(match[1].replace(/,/g, '')))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 50000);
  if (values.length === 0) return null;
  return Math.max(...values);
}
