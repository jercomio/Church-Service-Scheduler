import { Role } from './constants';

export interface UserDto {
  id: string;
  email: string;
  role: Role;
  memberId?: string | null;
}

export interface MemberDto {
  id: string;
  teamId: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  role?: Role;
  shiftCount?: number;
}

export interface SlotDto {
  id: string;
  teamId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string;
  isActive: boolean;
}

export interface ShiftDto {
  id: string;
  slotId: string;
  memberId: string;
  date: string;
  slot?: SlotDto;
  member?: MemberDto;
}

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export interface FeatureDto {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  tier?: string | null;
}

export interface TeamDto {
  id: string;
  name: string;
  members: MemberDto[];
  slots: SlotDto[];
}

export interface AuthResponseDto {
  token: string;
  user: UserDto;
}

export interface UserProfileDto {
  user: UserDto;
  team?: TeamDto;
  nextShift?: ShiftDto | null;
  nextShifts?: ShiftDto[];
  stats: {
    totalShifts: number;
    upcomingShifts: number;
  };
}
