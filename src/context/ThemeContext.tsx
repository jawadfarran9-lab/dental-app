import { useColorScheme } from '@/hooks/use-color-scheme';
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
  accentBlue: '#1E66FF',
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  inputBackground: '#F9FAFB',
  inputBorder: '#E5E7EB',
  inputPlaceholder: '#9CA3AF',
  promo: '#1E66FF',
  buttonBackground: '#1E66FF',
  buttonText: '#FFFFFF',
  buttonSecondaryBackground: '#E5E7EB',
  buttonSecondaryText: '#111827',
  error: '#E74C3C',
  bannerOverlay: 'rgba(212, 175, 55, 0.08)',
  scrim: 'rgba(0, 0, 0, 0.45)',
  // Additional AI Pro colors
  primary: '#1E66FF',
  success: '#10B981',
  text: '#111111',
  gray: '#6B7280',
  surface: '#F9FAFB',
  border: '#E5E7EB',
  cardBackground: '#FFFFFF',
  accentGreen: '#10B981',
  accentBrown: '#92400E',
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
