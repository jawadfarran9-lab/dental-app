export type HeroScreen = 'clinic' | 'patient' | 'session';

type HeroConfig = {
  light: string;
  dark: string;
};

const heroes: Record<HeroScreen, HeroConfig> = {
  clinic: {
    light: 'https://images.unsplash.com/photo-1520012172885-1c1e2884744b?auto=format&fit=crop&w=1200&q=80',
    dark: 'https://images.unsplash.com/photo-1504814532849-cff240bbc503?auto=format&fit=crop&w=1200&q=80',
  },
  patient: {
    light: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    dark: 'https://images.unsplash.com/photo-1508387024700-9fe5c0b37f29?auto=format&fit=crop&w=1200&q=80',
  },
  session: {
    light: 'https://images.unsplash.com/photo-1583911860205-72f29c0591b8?auto=format&fit=crop&w=1200&q=80',
    dark: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
  },
};

export function getHeroImage(screen: HeroScreen, isDark: boolean): string {
  const cfg = heroes[screen];
  return isDark ? cfg.dark : cfg.light;
}