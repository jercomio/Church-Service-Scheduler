import { ShiftDto, ApiError } from '@css/shared';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toShiftDto } from '../../mappers';
import {
  addDaysUtc,
  endOfMonthUtc,
  fromDateOnly,
  startOfMonthUtc,
  startOfWeekUtc,
} from '../../../domain/services/date-utils';

export class ListShiftsUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
  ) {}

  /**
   * PLAN-01 / PLAN-02 — weekly or monthly schedule for the team.
   * Only coordinators and admins can read the full schedule (PLAN-07);
   * regular members only see their own assignments via /me/shifts.
   */
  async execute(
    ctx: AuthContext,
    query: { week?: string; month?: string },
  ): Promise<ShiftDto[]> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can view the schedule');
    }
    const me = await this.users.findMemberByUserId(ctx.userId);
    if (!me) throw new Error(`No member profile for user ${ctx.userId}`);

    const [teamMembers, teamSlots] = await Promise.all([
      this.members.findByTeam(me.teamId),
      this.slots.findByTeam(me.teamId),
    ]);
    const memberIds = new Set(teamMembers.map((m) => m.id));
    const slotIds = new Set(teamSlots.map((s) => s.id));

    let from: Date;
    let to: Date;
    if (query.month) {
      const anchor = fromDateOnly(`${query.month}-01`);
      from = startOfMonthUtc(anchor);
      to = endOfMonthUtc(anchor);
    } else {
      const anchor = query.week ? fromDateOnly(query.week) : new Date();
      from = startOfWeekUtc(anchor);
      to = addDaysUtc(from, 6);
    }

    const shifts = await this.shifts.findByDateRange(from, to);
    const teamShifts = shifts.filter(
      (shift) => memberIds.has(shift.memberId) && slotIds.has(shift.slotId),
    );

    const slotsById = new Map(teamSlots.map((slot) => [slot.id, slot]));
    const membersById = new Map(teamMembers.map((member) => [member.id, member]));

    return teamShifts.map((shift) =>
      toShiftDto(shift, { slot: slotsById.get(shift.slotId), member: membersById.get(shift.memberId) }),
    );
  }
}
