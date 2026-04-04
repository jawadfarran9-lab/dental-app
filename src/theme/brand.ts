export const BRAND = {
  blue: '#3D9EFF',

  blueTintLight: 'rgba(61,158,255,0.08)',
  blueTintMedium: 'rgba(61,158,255,0.18)',
  blueTintStrong: 'rgba(61,158,255,0.40)',

  textPrimary: '#1A2B3F',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  background: '#FFFFFF',
  card: '#FFFFFF',

  borderLight: 'rgba(0,0,0,0.08)',
  borderUltraLight: 'rgba(0,0,0,0.04)',

  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',

  shadow: '#000000',

  // Accent colors (create sheet)
  accentGreen: '#34C759',
  accentGreenBg: '#E8F5E9',
  accentPink: '#FF375F',
  accentPinkBg: '#FCE4EC',
  accentPurple: '#AF52DE',
  accentPurpleBg: '#F3E5F5',
  accentSoftBlue: '#4A90D9',
  accentSoftBlueBg: '#E3F2FD',

  // Gradient arrays (premium background)
  gradientLight: ['#E0F2FE', '#E4F3FC', '#EDF8FF', '#F5FBFF', '#E4F5FC', '#E0F2FE'] as const,
  gradientLightLocations: [0, 0.2, 0.4, 0.6, 0.8, 1] as const,
  gradientDark: ['#0F172A', '#1E293B', '#162033', '#1E293B', '#0F172A'] as const,
  gradientDarkLocations: [0, 0.25, 0.5, 0.75, 1] as const,
};
