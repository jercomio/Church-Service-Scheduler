import { ApiError, CreateShiftInput, ShiftDto } from '@css/shared';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toShiftDto } from '../../mappers';
import { assertNoConflict } from '../../../domain/services/shift-conflict.service';
import { fromDateOnly } from '../../../domain/services/date-utils';
import { ShiftNotifier } from '../../services/shift-notifier';

export class CreateShiftUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
    private readonly notifier: ShiftNotifier,
  ) {}

  async execute(ctx: AuthContext, input: CreateShiftInput): Promise<ShiftDto> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can assign shifts');
    }
    const coordinator = await this.users.findMemberByUserId(ctx.userId);
    if (!coordinator) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    const [slot, member] = await Promise.all([
      this.slots.findById(input.slotId),
      this.members.findById(input.memberId),
    ]);
    if (!slot) throw new ApiError('NOT_FOUND', 404, 'Slot not found');
    if (!slot.isActive) throw new ApiError('SLOT_INACTIVE', 400, 'This slot is inactive');
    if (!member) throw new ApiError('NOT_FOUND', 404, 'Member not found');
    if (member.teamId !== coordinator.teamId) {
      throw new ApiError('FORBIDDEN', 403, 'Member does not belong to your team');
    }
    if (!member.isActive) throw new ApiError('MEMBER_INACTIVE', 400, 'This member is inactive');

    const date = fromDateOnly(input.date);
    const existing = await this.shifts.findByMemberAndDate(member.id, date);
    assertNoConflict(member.id, date, existing);

    const shift = await this.shifts.create({ slotId: slot.id, memberId: member.id, date });

    await this.notifier.notifyAssigned(shift, slot, member);

    return toShiftDto(shift, { slot, member });
  }
}
