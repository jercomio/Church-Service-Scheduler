import '@/lib/setup-nativewind';
import '../global.css';

import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/react-query-persist-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authStorage } from '@/lib/api';
import { cacheScopeFromToken, createAppPersister } from '@/lib/cache-persist';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useFeatures } from '@/hooks/queries';
import { useAccessDecision } from '@/lib/guards';
import { Spinner } from '@/components/ui/Spinner';

function RootNavigator() {
  const { status, user, bootstrap } = useAuthStore();
  const { mode, hydrated, hydrate } = useThemeStore();
  const featuresQuery = useFeatures();
  const [cacheScope, setCacheScope] = useState<string | null>(null);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Persist/restore the query cache per auth session so a cold start renders
  // instantly and refreshes in the background.
  useEffect(() => {
    let cancelled = false;
    void authStorage.getToken().then((token) => {
      if (cancelled) return;
      const next =
        status === 'loading' || status === 'authenticated'
          ? cacheScopeFromToken(token)
          : null;
      setCacheScope(next);
    });
    return () => {
      cancelled = true;
    };
  }, [status, user]);

  useEffect(() => {
    if (!cacheScope) return;
    const persister = createAppPersister(cacheScope);
    void persistQueryClientRestore({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24,
    });
    const unsubscribe = persistQueryClientSubscribe({ queryClient, persister });
    return unsubscribe;
  }, [cacheScope]);

  const features = Object.fromEntries(
    (featuresQuery.data ?? []).map((f) => [f.key, f.enabled]),
  );

  const decision = useAccessDecision(user, features);

  const featuresReady = status !== 'authenticated' || !featuresQuery.isPending;

  if (!hydrated || status === 'idle' || status === 'loading') {
    return <Spinner />;
  }

  return (
    <View className={`flex-1 bg-background ${mode === 'dark' ? 'dark' : ''}`}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {featuresReady && !decision.allowed ? (
        <Redirect href={decision.redirectTo ?? '/'} />
      ) : null}
      <Slot />
      {!featuresReady ? (
        <View className="absolute inset-0 z-50 bg-background">
          <Spinner />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
