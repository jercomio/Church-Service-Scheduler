import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const CACHE_PREFIX = 'css-qc';

/** Stable per-session scope so different accounts never share cached data. */
export function cacheScopeFromToken(token: string | null): string | null {
  if (!token) return null;
  return `${CACHE_PREFIX}-${token.slice(-32)}`;
}

export function createAppPersister(scope: string) {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: scope,
    throttleTime: 1000,
  });
}

export async function clearPersistedCache(scope: string): Promise<void> {
  await AsyncStorage.removeItem(scope);
}
