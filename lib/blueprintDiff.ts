export type DiffChange = {
  id: string;
  kind: 'added' | 'removed' | 'dimension';
  label: string;
  from?: string;
  to?: string;
};

export const A101_CHANGES: DiffChange[] = [
  { id: '1', kind: 'dimension', label: 'Corridor width at grid D', from: '12 ft 4 in', to: '11 ft 8 in' },
  { id: '2', kind: 'added', label: 'Firestop sleeve callouts rooms 204–208' },
  { id: '3', kind: 'removed', label: 'Temp partition at dock 2' },
  { id: '4', kind: 'added', label: 'Lighting relocates on E-301 overlay' },
];
