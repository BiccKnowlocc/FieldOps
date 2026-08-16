import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';

import { daysUntil, formatDay } from './dates';
import type { Certification, Drawing, PunchItem, ToolboxTalk } from './types';

export function certStatus(expiresOn: string) {
  const days = daysUntil(expiresOn);
  if (days < 0) return 'expired' as const;
  if (days <= 30) return 'soon' as const;
  return 'ok' as const;
}

export function certSummary(cert: Certification) {
  const days = daysUntil(cert.expiresOn);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days <= 30) return `${days}d left`;
  return `Good through ${formatDay(cert.expiresOn)}`;
}

export function punchesForDrawing(punches: PunchItem[], drawing: Drawing) {
  const hint = drawing.linkHint.trim().toLowerCase();
  if (!hint) return [];
  return punches.filter(
    (item) => item.locationNote.toLowerCase().includes(hint) || item.title.toLowerCase().includes(hint),
  );
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function talkRosterText(input: { talk: ToolboxTalk; siteName: string; names: string[] }) {
  const signed = input.names.length ? input.names.map((name) => `- ${name}`).join('\n') : '- Nobody signed in';
  return [
    'FieldOps toolbox talk',
    input.siteName,
    `${input.talk.topic} · ${formatDay(input.talk.date)}`,
    '',
    'Talking points',
    ...input.talk.points.map((point) => `- ${point}`),
    '',
    'Signed in',
    signed,
  ].join('\n');
}

export async function exportTalkRoster(input: { talk: ToolboxTalk; siteName: string; names: string[] }) {
  const text = talkRosterText(input);
  const html = `<html><head><meta charset="utf-8" /></head>
<body style="font-family: Helvetica, Arial, sans-serif; color: #102033; padding: 24px;">
  <p style="letter-spacing: 0.4px; font-size: 12px; color: #5C6B7A;">FIELDOPS TOOLBOX TALK</p>
  <h1 style="font-size: 28px;">${escapeHtml(input.talk.topic)}</h1>
  <p>${escapeHtml(input.siteName)} · ${escapeHtml(formatDay(input.talk.date))}</p>
  <h2>Talking points</h2>
  <ul>${input.talk.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>
  <h2>Signed in (${input.names.length})</h2>
  <ul>${input.names.length ? input.names.map((name) => `<li>${escapeHtml(name)}</li>`).join('') : '<li>Nobody signed in</li>'}</ul>
</body></html>`;
  try {
    if (Platform.OS === 'web') {
      await Print.printToFileAsync({ html });
      return;
    }
    await Print.printAsync({ html });
  } catch {
    await Share.share({ message: text, title: 'Toolbox talk roster' });
  }
}
