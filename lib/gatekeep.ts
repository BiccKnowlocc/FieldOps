import { certStatus } from './safety';
import type { Asset, Certification, CrewMember } from './types';

export function requiredTickets(asset: Asset): Certification['kind'][] {
  if (asset.kind === 'heavy') return ['osha10', 'lift'];
  if (asset.kind === 'truck') return ['osha10'];
  return [];
}

export function blockingCerts(input: {
  asset: Asset;
  certs: Certification[];
  operatorName: string;
  crew: CrewMember[];
}) {
  const needed = requiredTickets(input.asset);
  if (needed.length === 0) return [];
  const member = input.crew.find((item) => item.name === input.operatorName);
  const mine = input.certs.filter((cert) => (member ? cert.crewId === member.id : cert.crewName === input.operatorName));
  return needed.filter((kind) => {
    const hit = mine.find((cert) => cert.kind === kind || (kind === 'osha10' && cert.kind === 'osha30'));
    return !hit || certStatus(hit.expiresOn) === 'expired';
  });
}
