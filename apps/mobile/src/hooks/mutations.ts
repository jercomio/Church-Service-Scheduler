import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  MemberDto,
  NotificationDto,
  ShiftDto,
  SlotDto,
  TeamDto,
  UserDto,
  UserProfileDto,
} from '@css/shared';
import { api } from '@/lib/api';

export function useTransferAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newAdminMemberId: string) =>
      api.post<{ ok: true; newAdmin: MemberDto }>('/me/transfer-admin', { newAdminMemberId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['members'] });
      void qc.invalidateQueries({ queryKey: ['team'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useChangeMyRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: 'COORDINATOR' | 'MEMBER') =>
      api.patch<{ user: UserDto }>('/me/role', { role }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['members'] });
      void qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useDeleteMyAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<{ ok: true }>('/me'),
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: string; slotId: string; date: string }) =>
      api.post<ShiftDto>('/shifts', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shifts'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useCreateShifts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberIds: string[]; slotId: string; date: string }) =>
      api.post<ShiftDto[]>('/shifts/batch', input),
    onMutate: async ({ memberIds, slotId, date }) => {
      await qc.cancelQueries({ queryKey: ['shifts'] });
      await qc.cancelQueries({ queryKey: ['me'] });

      const previous = qc.getQueriesData<ShiftDto[]>({ queryKey: ['shifts'] });
      const previousMe = qc.getQueryData<ShiftDto[]>(['me', 'shifts']);

      const month = date.slice(0, 7);
      const slot =
        qc.getQueryData<SlotDto[]>(['slots'])?.find((s) => s.id === slotId);
      const members = qc.getQueryData<MemberDto[]>(['members']) ?? [];
      const profile = qc.getQueryData<UserProfileDto>(['me', 'profile']);
      const myMemberId = profile?.user.memberId ?? null;

      const optimisticShifts: ShiftDto[] = memberIds.map((memberId, index) => {
        const member = members.find((m) => m.id === memberId);
        return {
          id: `temp-${date}-${slotId}-${memberId}-${index}`,
          date,
          slotId,
          memberId,
          slot,
          member,
        };
      });

      qc.setQueriesData<ShiftDto[]>(
        { queryKey: ['shifts', 'month', month] },
        (old) => [...(old ?? []), ...optimisticShifts],
      );

      if (myMemberId && memberIds.includes(myMemberId)) {
        qc.setQueryData<ShiftDto[]>(['me', 'shifts'], (old) => [
          ...(old ?? []),
          ...optimisticShifts,
        ]);
      }

      return { previous, previousMe };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.previous ?? []) {
        qc.setQueryData<ShiftDto[]>(key, data);
      }
      if (context?.previousMe !== undefined) {
        qc.setQueryData<ShiftDto[]>(['me', 'shifts'], context.previousMe);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['shifts'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { memberId?: string; slotId?: string; date?: string };
    }) => api.patch<ShiftDto>(`/shifts/${id}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shifts'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/shifts/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['shifts'] });
      await qc.cancelQueries({ queryKey: ['me'] });

      const previous = qc.getQueriesData<ShiftDto[]>({ queryKey: ['shifts'] });
      const previousMe = qc.getQueryData<ShiftDto[]>(['me', 'shifts']);

      qc.setQueriesData(
        { queryKey: ['shifts'] },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.filter((shift) => (shift as ShiftDto).id !== id);
        },
      );
      qc.setQueryData<ShiftDto[]>(['me', 'shifts'], (old) =>
        (old ?? []).filter((shift) => shift.id !== id),
      );

      return { previous, previousMe };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.previous ?? []) {
        qc.setQueryData<ShiftDto[]>(key, data);
      }
      if (context?.previousMe) {
        qc.setQueryData<ShiftDto[]>(['me', 'shifts'], context.previousMe);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['shifts'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      firstName: string;
      lastName: string;
      email?: string;
      role?: 'COORDINATOR' | 'MEMBER';
    }) => api.post<MemberDto>('/members', input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['members'] });
      await qc.cancelQueries({ queryKey: ['team'] });

      const previous = qc.getQueryData<MemberDto[]>(['members']);
      const tempId = `temp-member-${Date.now()}`;
      const optimistic: MemberDto = {
        id: tempId,
        teamId: '',
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
        isActive: true,
        role: input.role ?? 'MEMBER',
        shiftCount: 0,
      };

      qc.setQueryData<MemberDto[]>(['members'], (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      const team = qc.getQueryData<TeamDto>(['team']);
      if (team) {
        qc.setQueryData<TeamDto>(['team'], {
          ...team,
          members: [...team.members, optimistic],
        });
      }

      return { previous, tempId };
    },
    onSuccess: (member, _variables, context) => {
      if (!context) return;
      qc.setQueryData<MemberDto[]>(['members'], (old) =>
        (old ?? []).map((m) => (m.id === context.tempId ? member : m)),
      );
      const team = qc.getQueryData<TeamDto>(['team']);
      if (team) {
        qc.setQueryData<TeamDto>(['team'], {
          ...team,
          members: team.members.map((m) => (m.id === context.tempId ? member : m)),
        });
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(['members'], context.previous);
      }
      void qc.invalidateQueries({ queryKey: ['team'] });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['members'] });
      void qc.invalidateQueries({ queryKey: ['team'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        firstName?: string;
        lastName?: string;
        email?: string;
        isActive?: boolean;
        phone?: string;
        address?: string;
        avatarUrl?: string;
        role?: 'COORDINATOR' | 'MEMBER';
      };
    }) => api.patch<MemberDto>(`/members/${id}`, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: ['members'] });
      await qc.cancelQueries({ queryKey: ['team'] });
      await qc.cancelQueries({ queryKey: ['me'] });

      const previousMembers = qc.getQueryData<MemberDto[]>(['members']);
      const previousTeam = qc.getQueryData<TeamDto>(['team']);
      const previousProfile = qc.getQueryData<UserProfileDto>(['me', 'profile']);

      const patch = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
      ) as Partial<MemberDto>;
      const applyPatch = (member: MemberDto): MemberDto =>
        member.id === id ? { ...member, ...patch } : member;

      qc.setQueryData<MemberDto[]>(['members'], (old) =>
        (old ?? []).map(applyPatch),
      );
      const team = qc.getQueryData<TeamDto>(['team']);
      if (team) {
        qc.setQueryData<TeamDto>(['team'], {
          ...team,
          members: team.members.map(applyPatch),
        });
      }
      const profile = qc.getQueryData<UserProfileDto>(['me', 'profile']);
      if (profile?.team?.members) {
        qc.setQueryData<UserProfileDto>(['me', 'profile'], {
          ...profile,
          team: {
            ...profile.team,
            members: profile.team.members.map(applyPatch),
          },
        });
      }

      return { previousMembers, previousTeam, previousProfile };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousMembers !== undefined) {
        qc.setQueryData(['members'], context.previousMembers);
      }
      if (context?.previousTeam) {
        qc.setQueryData(['team'], context.previousTeam);
      }
      if (context?.previousProfile) {
        qc.setQueryData(['me', 'profile'], context.previousProfile);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['members'] });
      void qc.invalidateQueries({ queryKey: ['team'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/members/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['members'] });
      await qc.cancelQueries({ queryKey: ['team'] });
      await qc.cancelQueries({ queryKey: ['shifts'] });

      const previousMembers = qc.getQueryData<MemberDto[]>(['members']);
      const previousTeam = qc.getQueryData<TeamDto>(['team']);
      const previousShifts = qc.getQueriesData<ShiftDto[]>({ queryKey: ['shifts'] });

      qc.setQueryData<MemberDto[]>(['members'], (old) =>
        (old ?? []).filter((m) => m.id !== id),
      );
      const team = qc.getQueryData<TeamDto>(['team']);
      if (team) {
        qc.setQueryData<TeamDto>(['team'], {
          ...team,
          members: team.members.filter((m) => m.id !== id),
        });
      }
      qc.setQueriesData(
        { queryKey: ['shifts'] },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.filter((shift) => (shift as ShiftDto).memberId !== id);
        },
      );

      return { previousMembers, previousTeam, previousShifts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousMembers !== undefined) {
        qc.setQueryData(['members'], context.previousMembers);
      }
      if (context?.previousTeam) {
        qc.setQueryData(['team'], context.previousTeam);
      }
      for (const [key, data] of context?.previousShifts ?? []) {
        qc.setQueryData<ShiftDto[]>(key, data);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['members'] });
      void qc.invalidateQueries({ queryKey: ['team'] });
      void qc.invalidateQueries({ queryKey: ['shifts'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useCreateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { dayOfWeek: number; startTime: string; endTime: string; label: string }) =>
      api.post<SlotDto>('/slots', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['slots'] });
      void qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useUpdateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { dayOfWeek?: number; startTime?: string; endTime?: string; label?: string; isActive?: boolean };
    }) => api.patch<SlotDto>(`/slots/${id}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['slots'] });
      void qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useReadNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<NotificationDto>(`/notifications/${id}/read`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useReadAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/notifications/read-all'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/notifications/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDeleteNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.post<{ ok: true }>('/notifications/delete', { ids }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
