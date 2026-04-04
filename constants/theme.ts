import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Palette aligned with Screenshots.docx reference: mint/teal partner UI,
 * emerald CTAs, light surfaces, high-contrast type.
 */
export const Colors = {
  primary: '#1FA87B',
  primaryDark: '#0E8F68',
  primaryMuted: '#B8E8D5',
  primarySoft: '#E8F7F1',
  accentMint: '#8ED9BA',
  background: '#FFFFFF',
  surface: '#F4F6F8',
  surfaceElevated: '#FFFFFF',
  border: '#E8ECF0',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  danger: '#E11D48',
  dangerSoft: '#FEE4E8',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  orange: '#EA580C',
  star: '#F59E0B',
  link: '#00A896',
  black: '#000000',
  overlay: 'rgba(15, 23, 42, 0.45)',
  timerPink: '#FCE7F3',
  timerRed: '#BE123C',
  helperBannerBg: '#FEF9C3',
  helperBannerBorder: '#FDE047',
  helperBannerText: '#854D0E',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

/** Soft elevation — reference uses layered, non-harsh depth */
export const Shadows = {
  floatSm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  floatMd: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  } satisfies ViewStyle,
  floatLg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  } satisfies ViewStyle,
  sheetTop: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  } satisfies ViewStyle,
} as const;

export const Type = {
  h1: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: 0.35,
    color: Colors.text,
  } satisfies TextStyle,
  h2: {
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
    color: Colors.text,
  } satisfies TextStyle,
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.textSecondary } satisfies TextStyle,
  caption: { fontSize: 13, fontWeight: '500' as const, color: Colors.textSecondary } satisfies TextStyle,
  button: { fontSize: 16, fontWeight: '700' as const } satisfies TextStyle,
} as const;
