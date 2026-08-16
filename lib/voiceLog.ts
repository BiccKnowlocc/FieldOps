import type { CrewMember, DailyLog, DelayType } from './types';

export const DEMO_VOICE_TAKE =
  'We had 4 operators on site today. Dug out 120 feet of trenching on the north lot with the 20-tonne excavator. Hit hard rock around 2 PM which set us back 2 hours. Took delivery of 40 tonnes of aggregate from Lafarge.';

export type VoiceParse = {
  transcript: string;
  crewCount: number;
  workChips: string[];
  workNotes: string;
  delays: { type: DelayType; hours: number; notes: string }[];
  deliveries: { supplier: string; description: string }[];
  costCodes: string[];
  flags: string[];
  draftChangeOrder: string | null;
};

export function parseVoiceLog(transcript: string, crew: CrewMember[]): VoiceParse {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const crewCount = Number(lower.match(/(\d+)\s+(operators?|guys|crew|people)/)?.[1] ?? crew.length);
  const trench = lower.match(/(\d+)\s*(feet|ft|lf)/);
  const rock = /hard rock|rock|unforeseen/.test(lower);
  const delayHours = Number(lower.match(/set us back\s+(\d+(?:\.\d+)?)\s*hours?/)?.[1] ?? (rock ? 2 : 0));
  const tonnes = lower.match(/(\d+)\s*tonnes?/);
  const supplier = lower.match(/from\s+([a-z0-9 &.-]+?)(?:\.|$)/i)?.[1]?.trim() ?? '';
  const workChips: string[] = [];
  if (/trench|excav/.test(lower)) workChips.push('Excavation');
  if (/frame/.test(lower)) workChips.push('Framing');
  if (/pour|concrete/.test(lower)) workChips.push('Concrete pour');
  if (/deliver/.test(lower)) workChips.push('Deliveries');
  const costCodes: string[] = [];
  if (workChips.includes('Excavation')) costCodes.push('31-200');
  if (workChips.includes('Concrete pour')) costCodes.push('03-300');
  if (/\b(labor|operators?)\b/.test(lower)) costCodes.push('01-000');
  const flags: string[] = [];
  if (rock) flags.push('Delay trigger: hit hard rock');
  if (/no-show|didn'?t show/.test(lower)) flags.push('Delay trigger: subcontractor no-show');
  const deliveries = tonnes
    ? [{ supplier: supplier || 'Supplier', description: `${tonnes[1]} tonnes aggregate` }]
    : [];
  return {
    transcript: text,
    crewCount,
    workChips: workChips.length ? workChips : ['Site cleanup'],
    workNotes: text,
    delays: delayHours > 0 ? [{ type: rock ? 'other' : 'material_wait', hours: delayHours, notes: rock ? 'Hit hard rock' : 'Delay from voice log' }] : [],
    deliveries,
    costCodes,
    flags,
    draftChangeOrder: rock ? 'Unforeseen rock — draft CO from voice log' : null,
  };
}

export function applyVoiceToLog(log: DailyLog, parsed: VoiceParse, crew: CrewMember[]): DailyLog {
  const crewIds = crew.slice(0, Math.max(1, parsed.crewCount)).map((member) => member.id);
  return {
    ...log,
    crewIds: crewIds.length ? crewIds : log.crewIds,
    workChips: Array.from(new Set([...log.workChips, ...parsed.workChips])),
    workNotes: parsed.workNotes,
    delays: [
      ...log.delays,
      ...parsed.delays.map((delay, index) => ({
        id: `voice-delay-${log.id}-${index}`,
        type: delay.type,
        hours: delay.hours,
        notes: delay.notes,
      })),
    ],
    deliveries: [
      ...log.deliveries,
      ...parsed.deliveries.map((item, index) => ({
        id: `voice-del-${log.id}-${index}`,
        supplier: item.supplier,
        description: item.description,
        received: true,
      })),
    ],
  };
}
