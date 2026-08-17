import { create } from 'zustand';
import type { AuthResponseDto, UserDto } from '@css/shared';
import { ApiError, api, authStorage } from '@/lib/api';
import { cacheScopeFromToken, clearPersistedCache } from '@/lib/cache-persist';
import { prefetchAppData } from '@/lib/prefetch';
import { queryClient } from '@/lib/query-client';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  setUser: (user: UserDto) => void;
  logout: () => Promise<void>;
}

function applyAuth(res: AuthResponseDto) {
  void authStorage.setToken(res.token);
  api.setToken(res.token);
  // Never reuse another session's cached data.
  queryClient.clear();
  prefetchAppData();
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  user: null,

  async bootstrap() {
    const token = await authStorage.getToken();
    if (!token) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    api.setToken(token);
    set({ status: 'loading' });
    try {
      const me = await api.get<{ user: UserDto }>('/me');
      set({ status: 'authenticated', user: me.user });
      prefetchAppData();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await authStorage.clearToken();
        api.setToken(null);
        set({ status: 'unauthenticated', user: null });
      } else {
        set({ status: 'unauthenticated', user: null });
      }
    }
  },

  async login(email, password) {
    const res = await api.post<AuthResponseDto>('/auth/login', { email, password });
    applyAuth(res);
    set({ status: 'authenticated', user: res.user });
  },

  async signup(firstName, lastName, email, password) {
    const res = await api.post<AuthResponseDto>('/auth/signup', {
      firstName,
      lastName,
      email,
      password,
    });
    applyAuth(res);
    set({ status: 'authenticated', user: res.user });
  },

  setUser(user) {
    set({ user });
  },

  async logout() {
    const token = await authStorage.getToken();
    const scope = cacheScopeFromToken(token);
    await authStorage.clearToken();
    api.setToken(null);
    queryClient.clear();
    if (scope) await clearPersistedCache(scope);
    set({ status: 'unauthenticated', user: null });
  },
}));
