import { useColorScheme } from '@/hooks/use-color-scheme';
import { BRAND } from '@/src/theme/brand';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  textPrimary: string;
  textSecondary: string;
  accentBlue: string;
  card: string;
  cardBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  promo: string;
  buttonBackground: string;
  buttonText: string;
  buttonSecondaryBackground: string;
  buttonSecondaryText: string;
  error: string;
  bannerOverlay: string;
  scrim: string;
  // Additional AI Pro colors
  primary: string;
  success: string;
  text: string;
  gray: string;
  surface: string;
  border: string;
  cardBackground: string;
  accentGreen: string;
  accentBrown: string;
  premiumSheet: string;
  // Settings module tokens
  textMuted: string;
  textSubtle: string;
  textHeading: string;
  textHint: string;
  iconMuted: string;
  brandBlue: string;
  cardBg: string;
  modalBg: string;
  tooltipBg: string;
  tooltipText: string;
  modalText: string;
  cancelText: string;
  borderTint: string;
  rowHighlight: string;
  rowHighlightActive: string;
  brandBlueTint: string;
  chipInactive: string;
  toggleTrackOn: string;
  toggleTrackOff: string;
  toggleThumb: string;
  statusGreen: string;
  statusAmber: string;
  statusRed: string;
  shadow: string;
  overlay: string;
}

export interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LIGHT_COLORS: ThemeColors = {
  background: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#1F2937',
  accentBlue: BRAND.blue,
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  inputBackground: '#F9FAFB',
  inputBorder: '#E5E7EB',
  inputPlaceholder: '#9CA3AF',
  promo: '#3D9EFF',
  buttonBackground: '#3D9EFF',
  buttonText: '#FFFFFF',
  buttonSecondaryBackground: '#E5E7EB',
  buttonSecondaryText: '#111827',
  error: '#E74C3C',
  bannerOverlay: 'rgba(212, 175, 55, 0.08)',
  scrim: 'rgba(0, 0, 0, 0.45)',
  // Additional AI Pro colors
  primary: BRAND.blue,
  success: '#10B981',
  text: '#111111',
  gray: '#6B7280',
  surface: '#F9FAFB',
  border: '#E5E7EB',
  cardBackground: '#FFFFFF',
  accentGreen: '#10B981',
  accentBrown: '#92400E',
  premiumSheet: '#F6F9FF',
  // Settings module tokens
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  textHeading: '#1A2B3F',
  textHint: '#94A3B8',
  iconMuted: '#546E7A',
  brandBlue: BRAND.blue,
  cardBg: '#FFFFFF',
  modalBg: '#FFFFFF',
  tooltipBg: 'rgba(255,255,255,0.95)',
  tooltipText: '#1E293B',
  modalText: '#374151',
  cancelText: '#6B7280',
  borderTint: 'rgba(0,0,0,0.08)',
  rowHighlight: 'rgba(0,0,0,0.04)',
  rowHighlightActive: 'rgba(61,158,255,0.06)',
  brandBlueTint: 'rgba(61,158,255,0.25)',
  chipInactive: 'rgba(0,0,0,0.05)',
  toggleTrackOn: '#3D9EFF',
  toggleTrackOff: '#D1D5DB',
  toggleThumb: '#FFFFFF',
  statusGreen: '#22C55E',
  statusAmber: '#F59E0B',
  statusRed: '#EF4444',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.4)',
};

const DARK_COLORS: ThemeColors = {
  background: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#E5E7EB',
  accentBlue: '#D4AF37',
  card: '#0F0F10',
  cardBorder: '#1F1F23',
  inputBackground: '#0B1020',
  inputBorder: '#1F2937',
  inputPlaceholder: '#9CA3AF',
  promo: '#D4AF37',
  buttonBackground: '#D4AF37',
  buttonText: '#000000',
  buttonSecondaryBackground: '#1F2937',
  buttonSecondaryText: '#E5E7EB',
  error: '#FF6B6B',
  bannerOverlay: 'rgba(212, 175, 55, 0.22)',
  scrim: 'rgba(0, 0, 0, 0.65)',
  // Additional AI Pro colors
  primary: '#D4AF37',
  success: '#10B981',
  text: '#FFFFFF',
  gray: '#9CA3AF',
  surface: '#0F0F10',
  border: '#1F1F23',
  cardBackground: '#0F0F10',
  accentGreen: '#10B981',
  accentBrown: '#D97706',
  premiumSheet: '#0F172A',
  // Settings module tokens
  textMuted: '#8A96A6',
  textSubtle: '#64748B',
  textHeading: '#F0F2F5',
  textHint: '#8A96A6',
  iconMuted: '#B0BEC5',
  brandBlue: BRAND.blue,
  cardBg: 'rgba(30,42,60,0.6)',
  modalBg: '#1E2A3C',
  tooltipBg: 'rgba(30,42,60,0.95)',
  tooltipText: '#E2E8F0',
  modalText: '#D1D5DB',
  cancelText: '#94A3B8',
  borderTint: 'rgba(255,255,255,0.08)',
  rowHighlight: 'rgba(255,255,255,0.06)',
  rowHighlightActive: 'rgba(61,158,255,0.10)',
  brandBlueTint: 'rgba(61,158,255,0.35)',
  chipInactive: 'rgba(255,255,255,0.08)',
  toggleTrackOn: '#3D9EFF',
  toggleTrackOff: '#3A3F47',
  toggleThumb: '#FFFFFF',
  statusGreen: '#22C55E',
  statusAmber: '#F59E0B',
  statusRed: '#EF4444',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.4)',
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme() ?? 'light';
  const [theme, setTheme] = useState<ThemeMode>(systemColorScheme as ThemeMode);

  useEffect(() => {
    // Always follow system setting; no manual toggle/persistence
    setTheme(systemColorScheme as ThemeMode);
  }, [systemColorScheme]);

  const toggleTheme = () => {
    // Manual toggle disabled per scope; follow system appearance
    setTheme(systemColorScheme as ThemeMode);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const value: ThemeContextType = {
    theme,
    isDark,
    colors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
