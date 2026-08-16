export type VisionFinding = {
  id: string;
  kind: 'ppe' | 'defect' | 'progress';
  label: string;
  confidence: number;
};

export function scanPhoto(tagHint?: string): VisionFinding[] {
  if (tagHint === 'progress') {
    return [
      { id: 'p1', kind: 'progress', label: 'Framing visible ~70% of this bay', confidence: 0.82 },
      { id: 'p2', kind: 'ppe', label: 'Hard hat detected', confidence: 0.91 },
    ];
  }
  return [
    { id: 'd1', kind: 'defect', label: 'Possible missing firestop at sleeve', confidence: 0.74 },
    { id: 'd2', kind: 'ppe', label: 'No hi-vis on one worker', confidence: 0.66 },
    { id: 'd3', kind: 'progress', label: 'MEP rough-in incomplete at plate', confidence: 0.71 },
  ];
}
