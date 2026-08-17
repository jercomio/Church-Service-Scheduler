import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
}

const KEY = 'css_theme_mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  hydrated: false,

  async hydrate() {
    const stored = await AsyncStorage.getItem(KEY);
    const mode: ThemeMode = stored === 'dark' ? 'dark' : 'light';
    set({ mode, hydrated: true });
  },

  async setMode(mode) {
    set({ mode });
    try {
      await AsyncStorage.setItem(KEY, mode);
    } catch {
      // persistence failure is non-fatal
    }
  },

  async toggle() {
    const next = get().mode === 'light' ? 'dark' : 'light';
    set({ mode: next });
    try {
      await AsyncStorage.setItem(KEY, next);
    } catch {
      // persistence failure is non-fatal
    }
  },
}));
