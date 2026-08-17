import { ApiError, ShiftDto, UpdateShiftInput } from '@css/shared';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toShiftDto } from '../../mappers';
import { assertNoConflict } from '../../../domain/services/shift-conflict.service';
import { fromDateOnly, isSameDay } from '../../../domain/services/date-utils';
import { ShiftNotifier } from '../../services/shift-notifier';

export class UpdateShiftUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
    private readonly notifier: ShiftNotifier,
  ) {}

  async execute(ctx: AuthContext, id: string, input: UpdateShiftInput): Promise<ShiftDto> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can manage shifts');
    }
    const coordinator = await this.users.findMemberByUserId(ctx.userId);
    if (!coordinator) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    const shift = await this.shifts.findById(id);
    if (!shift) throw new ApiError('NOT_FOUND', 404, 'Shift not found');

    const nextSlot = input.slotId ? await this.slots.findById(input.slotId) : null;
    if (input.slotId && !nextSlot) throw new ApiError('NOT_FOUND', 404, 'Slot not found');
    if (input.slotId && !nextSlot?.isActive) throw new ApiError('SLOT_INACTIVE', 400, 'This slot is inactive');

    const nextMember = input.memberId ? await this.members.findById(input.memberId) : null;
    if (input.memberId && !nextMember) throw new ApiError('NOT_FOUND', 404, 'Member not found');
    if (input.memberId && nextMember?.teamId !== coordinator.teamId) {
      throw new ApiError('FORBIDDEN', 403, 'Member does not belong to your team');
    }
    if (input.memberId && nextMember && !nextMember.isActive) {
      throw new ApiError('MEMBER_INACTIVE', 400, 'This member is inactive');
    }

    const nextDate = input.date ? fromDateOnly(input.date) : shift.date;
    const nextMemberId = nextMember?.id ?? shift.memberId;

    if (!isSameDay(nextDate, shift.date) || nextMemberId !== shift.memberId) {
      const onDate = await this.shifts.findByMemberAndDate(nextMemberId, nextDate);
      assertNoConflict(nextMemberId, nextDate, onDate, shift.id);
    }

    const updated = await this.shifts.update(id, {
      slotId: nextSlot?.id ?? shift.slotId,
      memberId: nextMemberId,
      date: nextDate,
    });
    if (!updated) throw new ApiError('NOT_FOUND', 404, 'Shift not found');

    const [finalSlot, finalMember] = await Promise.all([
      this.slots.findById(updated.slotId),
      this.members.findById(updated.memberId),
    ]);
    if (!finalSlot || !finalMember) throw new ApiError('NOT_FOUND', 404, 'Shift references missing');

    await this.notifier.notifyUpdated(updated, finalSlot, finalMember);

    return toShiftDto(updated, { slot: finalSlot, member: finalMember });
  }
}
