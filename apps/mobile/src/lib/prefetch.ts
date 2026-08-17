import type {
  FeatureDto,
  MemberDto,
  NotificationDto,
  ShiftDto,
  SlotDto,
  TeamDto,
  UserProfileDto,
} from '@css/shared';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const queries: {
  key: readonly unknown[];
  fetcher: () => Promise<unknown>;
}[] = [
  {
    key: ['me', 'profile'],
    fetcher: () => api.get<UserProfileDto>('/me'),
  },
  {
    key: ['me', 'shifts'],
    fetcher: () => api.get<ShiftDto[]>('/me/shifts'),
  },
  {
    key: ['team'],
    fetcher: () => api.get<TeamDto>('/team'),
  },
  {
    key: ['members'],
    fetcher: () => api.get<MemberDto[]>('/members'),
  },
  {
    key: ['slots'],
    fetcher: () => api.get<SlotDto[]>('/slots'),
  },
  {
    key: ['notifications'],
    fetcher: () => api.get<NotificationDto[]>('/notifications'),
  },
  {
    key: ['features'],
    fetcher: () => api.get<FeatureDto[]>('/features'),
  },
];

function planningMonthKeys(): string[] {
  const now = new Date();
  return [-1, 0, 1].map((offset) =>
    monthKey(new Date(now.getFullYear(), now.getMonth() + offset, 1)),
  );
}

/**
 * Warm the query cache for every screen in parallel right after the user is
 * authenticated. Each tab then renders from cache instantly; freshening
 * happens in the background via the global staleTime.
 */
export function prefetchAppData(): void {
  const all = [
    ...queries,
    ...planningMonthKeys().map((month) => ({
      key: ['shifts', 'month', month],
      fetcher: () => api.get<ShiftDto[]>(`/shifts?month=${month}`),
    })),
  ];
  for (const { key, fetcher } of all) {
    if (queryClient.getQueryData(key) !== undefined) continue;
    void queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fetcher,
      staleTime: 5 * 60_000,
    });
  }
}
