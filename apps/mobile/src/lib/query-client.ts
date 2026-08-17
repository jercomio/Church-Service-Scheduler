import { QueryClient } from '@tanstack/react-query';

const FIVE_MINUTES = 5 * 60_000;
const ONE_HOUR = 60 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: ONE_HOUR,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});
