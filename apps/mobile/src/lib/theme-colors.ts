import { useThemeStore } from '@/stores/theme.store';

const COLORS = {
  light: {
    background: 'hsl(0 0% 100%)',
    card: 'hsl(0 0% 100%)',
    mutedForeground: 'hsl(240 3.8% 46.1%)',
    primary: 'hsl(262.1 83.3% 57.8%)',
    input: 'hsl(240 5.9% 90%)',
    destructive: 'hsl(0 84.2% 60.2%)',
  },
  dark: {
    background: 'hsl(240 10% 3.9%)',
    card: 'hsl(240 7% 7%)',
    mutedForeground: 'hsl(240 5% 64.9%)',
    primary: 'hsl(263.4 70% 72%)',
    input: 'hsl(240 3.7% 15.9%)',
    destructive: 'hsl(0 72% 51%)',
  },
} as const;

export function useThemeColors() {
  const mode = useThemeStore((s) => s.mode);
  return COLORS[mode];
}
