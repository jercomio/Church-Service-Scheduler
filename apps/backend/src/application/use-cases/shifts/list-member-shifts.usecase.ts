import { ApiError, ShiftDto } from '@css/shared';
import { toShiftDto } from '../../mappers';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';

export class ListMemberShiftsUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
  ) {}

  async execute(ctx: AuthContext, memberId: string): Promise<ShiftDto[]> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can view member assignments');
    }
    const me = await this.users.findMemberByUserId(ctx.userId);
    if (!me) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    const member = await this.members.findById(memberId);
    if (!member) throw new ApiError('NOT_FOUND', 404, 'Member not found');
    if (member.teamId !== me.teamId) {
      throw new ApiError('FORBIDDEN', 403, 'Member is not in your team');
    }

    const [shifts, teamSlots] = await Promise.all([
      this.shifts.findByMemberId(member.id),
      this.slots.findByTeam(me.teamId),
    ]);
    const slotsById = new Map(teamSlots.map((slot) => [slot.id, slot]));

    return shifts
      .map((shift) => toShiftDto(shift, { slot: slotsById.get(shift.slotId), member }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
