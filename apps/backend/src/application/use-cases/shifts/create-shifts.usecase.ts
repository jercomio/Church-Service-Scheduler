import { ApiError, BatchCreateShiftInput, ShiftDto } from '@css/shared';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toShiftDto } from '../../mappers';
import { assertNoConflict } from '../../../domain/services/shift-conflict.service';
import { fromDateOnly } from '../../../domain/services/date-utils';
import { ShiftNotifier } from '../../services/shift-notifier';

export class CreateShiftsUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
    private readonly notifier: ShiftNotifier,
  ) {}

  async execute(ctx: AuthContext, input: BatchCreateShiftInput): Promise<ShiftDto[]> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can assign shifts');
    }
    const coordinator = await this.users.findMemberByUserId(ctx.userId);
    if (!coordinator) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    const slot = await this.slots.findById(input.slotId);
    if (!slot) throw new ApiError('NOT_FOUND', 404, 'Slot not found');
    if (!slot.isActive) throw new ApiError('SLOT_INACTIVE', 400, 'This slot is inactive');

    const members = await this.members.findByIds(input.memberIds);
    const memberById = new Map(members.map((m) => [m.id, m]));

    const date = fromDateOnly(input.date);
    const shifts = [];

    for (const memberId of input.memberIds) {
      const member = memberById.get(memberId);
      if (!member) throw new ApiError('NOT_FOUND', 404, 'Member not found');
      if (member.teamId !== coordinator.teamId) {
        throw new ApiError('FORBIDDEN', 403, 'Member does not belong to your team');
      }
      if (!member.isActive) throw new ApiError('MEMBER_INACTIVE', 400, 'This member is inactive');

      const existing = await this.shifts.findByMemberAndDate(member.id, date);
      assertNoConflict(member.id, date, existing);

      const shift = await this.shifts.create({ slotId: slot.id, memberId: member.id, date });
      shifts.push(shift);

      await this.notifier.notifyAssigned(shift, slot, member);
    }

    return shifts.map((shift) =>
      toShiftDto(shift, { slot, member: memberById.get(shift.memberId) }),
    );
  }
}
