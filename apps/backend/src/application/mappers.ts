import {
  FeatureDto,
  MemberDto,
  NotificationDto,
  ShiftDto,
  SlotDto,
  UserDto,
} from '@css/shared';
import { FeatureEntity } from '../domain/entities/feature';
import { MemberEntity } from '../domain/entities/member';
import { NotificationEntity } from '../domain/entities/notification';
import { ShiftEntity } from '../domain/entities/shift';
import { SlotEntity } from '../domain/entities/slot';
import { UserEntity } from '../domain/entities/user';
import { toDateOnly } from '../domain/services/date-utils';

export function toUserDto(user: UserEntity): UserDto {
  return { id: user.id, email: user.email, role: user.role };
}

export function toMemberDto(member: MemberEntity): MemberDto {
  return {
    id: member.id,
    teamId: member.teamId,
    userId: member.userId,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    address: member.address,
    avatarUrl: member.avatarUrl,
    isActive: member.isActive,
    role: member.role,
  };
}

export function toSlotDto(slot: SlotEntity): SlotDto {
  return {
    id: slot.id,
    teamId: slot.teamId,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    label: slot.label,
    isActive: slot.isActive,
  };
}

export function toShiftDto(
  shift: ShiftEntity,
  opts: { slot?: SlotEntity; member?: MemberEntity } = {},
): ShiftDto {
  return {
    id: shift.id,
    slotId: shift.slotId,
    memberId: shift.memberId,
    date: toDateOnly(shift.date),
    slot: opts.slot ? toSlotDto(opts.slot) : undefined,
    member: opts.member ? toMemberDto(opts.member) : undefined,
  };
}

export function toNotificationDto(notification: NotificationEntity): NotificationDto {
  return {
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    body: notification.body,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export function toFeatureDto(feature: FeatureEntity, enabled: boolean): FeatureDto {
  return {
    id: feature.id,
    key: feature.key,
    name: feature.name,
    description: feature.description,
    enabled,
    tier: feature.tier,
  };
}
