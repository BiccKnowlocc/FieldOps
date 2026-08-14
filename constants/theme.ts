export const colors = {
  navy: '#0B1F33',
  navyMid: '#16324D',
  ink: '#102033',
  paper: '#F4F1EA',
  card: '#FFFcf7',
  line: '#D9D2C5',
  muted: '#5C6B7A',
  orange: '#E85D04',
  orangePress: '#C44D03',
  gold: '#E9B949',
  green: '#2F6F4E',
  red: '#C0392B',
  blue: '#1D4E89',
  white: '#FFFFFF',
  overlay: 'rgba(11, 31, 51, 0.55)',
};

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const tap = {
  min: 52,
};

export const type = {
  title: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.4, color: colors.ink },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 16, fontWeight: '500' as const, color: colors.ink },
  label: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.4, color: colors.muted },
  meta: { fontSize: 13, fontWeight: '500' as const, color: colors.muted },
};

export const OFFICE_BREAKPOINT = 960;
