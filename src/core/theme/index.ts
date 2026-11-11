export const colors = {
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#E8F5E9',
  background: '#F5F7F6',
  surface: '#FFFFFF',
  border: '#E1E6E3',
  text: '#1C2421',
  textMuted: '#66736D',
  textInverse: '#FFFFFF',
  danger: '#C62828',
  dangerLight: '#FDECEA',
  warning: '#E08A00',
  warningLight: '#FFF4E0',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  info: '#1565C0',
  infoLight: '#E3F2FD',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600' },
} as const;

export const theme = { colors, spacing, radius, typography } as const;
