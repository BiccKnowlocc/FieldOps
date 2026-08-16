export type TicketParse = {
  vendor: string;
  ticketNo: string;
  material: string;
  netTons: number | null;
  amount: number | null;
  jobNumber: string | null;
  raw: string;
};

const DEMO_TICKET = `LAFARGE
Ticket 88421
Job 4200 Industrial
3/4" aggregate
Gross 82.40 t
Tare 42.10 t
Net 40.30 t
Amount $1,847.00`;

export const DEMO_TICKET_TEXT = DEMO_TICKET;

export function parseTicket(text: string): TicketParse {
  const raw = text.trim();
  const vendor =
    raw.match(/^(LAFARGE|ABC LUMBER|READY-MIX CO|HOME DEPOT|FUEL STOP|SUNBELT.*)/im)?.[1] ??
    raw.split('\n')[0]?.slice(0, 32) ??
    'Vendor';
  const ticketNo = raw.match(/ticket\s*#?\s*([A-Z0-9-]+)/i)?.[1] ?? raw.match(/\b(\d{4,})\b/)?.[1] ?? '';
  const netTons = Number(raw.match(/net\s+([0-9.]+)/i)?.[1] ?? raw.match(/(\d+(?:\.\d+)?)\s*t(?:ons?)?/i)?.[1] ?? '');
  const amountMatch = raw.match(/\$?\s*([0-9,]+\.\d{2})/);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null;
  const material = /aggregat|stone|gravel/i.test(raw)
    ? 'Aggregate'
    : /fuel|diesel/i.test(raw)
      ? 'Fuel'
      : /lumber|stud/i.test(raw)
        ? 'Framing lumber'
        : 'Material';
  const jobNumber = raw.match(/job\s*([0-9A-Z -]+)/i)?.[1]?.trim() ?? null;
  return {
    vendor: vendor.replace(/\n.*/s, '').trim(),
    ticketNo,
    material,
    netTons: Number.isFinite(netTons) && netTons > 0 ? netTons : null,
    amount,
    jobNumber,
    raw,
  };
}

export function poVariance(received: number, ordered: number) {
  const delta = received - ordered;
  if (Math.abs(delta) < 0.01) return { ok: true, message: 'Matches PO' };
  if (delta > 0) return { ok: false, message: `Over-delivery ${delta.toFixed(1)} t vs PO ${ordered} t` };
  return { ok: false, message: `Short load ${Math.abs(delta).toFixed(1)} t vs PO ${ordered} t` };
}
