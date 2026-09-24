export const colors = {
  navy: '#0B2545',
  navyDark: '#071A33',
  navySoft: '#12345F',
  blue: '#2E8FEE',
  blueSoft: '#E6F1FE',

  white: '#FFFFFF',
  background: '#F4F6F9',
  surface: '#FFFFFF',
  border: '#E2E6EC',

  textPrimary: '#14213D',
  textSecondary: '#5B6472',
  textInverse: '#FFFFFF',

  positive: '#16A34A',
  positiveSoft: '#E7F7ED',
  negative: '#DC2626',
  negativeSoft: '#FDEAEA',
  warning: '#F59E0B',
  warningSoft: '#FEF3E2',
  info: '#2E8FEE',
  infoSoft: '#E6F1FE',
  neutral: '#6B7280',
  neutralSoft: '#EEF0F3',
} as const;

export type StatusTone = 'positive' | 'negative' | 'warning' | 'info' | 'neutral';

export const toneColors: Record<StatusTone, { fg: string; bg: string }> = {
  positive: { fg: colors.positive, bg: colors.positiveSoft },
  negative: { fg: colors.negative, bg: colors.negativeSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
  neutral: { fg: colors.neutral, bg: colors.neutralSoft },
};
