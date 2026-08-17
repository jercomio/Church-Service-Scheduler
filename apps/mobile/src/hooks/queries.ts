import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
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

export interface SuggestMember {
  id: string;
  name: string;
  score: number;
  totalShifts: number;
}

export interface SuggestShiftResult {
  shift: ShiftDto | null;
  suggestedMember: SuggestMember;
  allCandidates: SuggestMember[];
}

export function useProfile() {
  return useQuery({
    queryKey: ['me', 'profile'],
    queryFn: () => api.get<UserProfileDto>('/me'),
    staleTime: 30_000,
  });
}

export function useMyShifts() {
  return useQuery({
    queryKey: ['me', 'shifts'],
    queryFn: () => api.get<ShiftDto[]>('/me/shifts'),
    staleTime: 30_000,
  });
}

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => api.get<TeamDto>('/team'),
    staleTime: 60_000,
  });
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<MemberDto[]>('/members'),
    staleTime: 60_000,
  });
}

export function useMemberShifts(memberId: string | null) {
  return useQuery({
    queryKey: ['members', memberId, 'shifts'],
    queryFn: () => api.get<ShiftDto[]>(`/members/${memberId}/shifts`),
    enabled: !!memberId,
    staleTime: 30_000,
  });
}

/**
 * Show a member's assignments instantly from the already-warmed team
 * schedule (month queries), then let the authoritative all-time fetch
 * replace it in the background. Always seeds (even empty) so opening a
 * member never shows a spinner.
 */
export function seedMemberShiftsFromCache(memberId: string): void {
  const cached = queryClient
    .getQueriesData<ShiftDto[]>({ queryKey: ['shifts', 'month'] })
    .flatMap(([, data]) => data ?? [])
    .filter((shift) => shift.memberId === memberId)
    .sort((a, b) => a.date.localeCompare(b.date));
  queryClient.setQueryData(['members', memberId, 'shifts'], cached, {
    updatedAt: 0,
  });
}

export function useSlots() {
  return useQuery({
    queryKey: ['slots'],
    queryFn: () => api.get<SlotDto[]>('/slots'),
    staleTime: 60_000,
  });
}

export function useShifts(months: string[]) {
  const results = useQueries({
    queries: months.map((month) => ({
      queryKey: ['shifts', 'month', month],
      queryFn: () => api.get<ShiftDto[]>(`/shifts?month=${month}`),
      staleTime: 5 * 60_000,
      placeholderData: keepPreviousData,
    })),
  });
  const data = results.flatMap((result) => result.data ?? []);
  const isLoading = results.every((result) => result.isPending);
  return { data, isLoading };
}

export function useShiftSuggestions(date: string | null, slotId: string | null) {
  return useQuery({
    queryKey: ['shifts', 'suggest', date, slotId],
    queryFn: () =>
      api.post<SuggestShiftResult>('/shifts/suggest', { date, slotId }),
    enabled: !!date && !!slotId,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<NotificationDto[]>('/notifications'),
    refetchInterval: 60_000,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.readAt).length ?? 0;
}

export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: () => api.get<FeatureDto[]>('/features'),
    staleTime: 5 * 60_000,
  });
}

export function useFeatureFlag(key: string) {
  const { data } = useFeatures();
  return data?.find((f) => f.key === key)?.enabled ?? false;
}
