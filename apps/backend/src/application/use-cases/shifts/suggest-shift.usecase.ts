import { ApiError, ShiftDto, SuggestShiftInput } from '@css/shared';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { suggestNextMember } from '../../../domain/services/rotation.service';
import { addDaysUtc, fromDateOnly } from '../../../domain/services/date-utils';

export interface SuggestShiftResult {
  shift: ShiftDto | null;
  suggestedMember: {
    id: string;
    name: string;
    score: number;
    totalShifts: number;
  };
  allCandidates: Array<{ id: string; name: string; score: number; totalShifts: number }>;
}

export class SuggestShiftUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
  ) {}

  /** PLAN-06 — Suggest the least-solicited active member for a slot+date. */
  async execute(ctx: AuthContext, input: SuggestShiftInput): Promise<SuggestShiftResult> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can use shift suggestions');
    }
    const me = await this.users.findMemberByUserId(ctx.userId);
    if (!me) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    const slot = await this.slots.findById(input.slotId);
    if (!slot) throw new ApiError('NOT_FOUND', 404, 'Slot not found');
    if (slot.teamId !== me.teamId) {
      throw new ApiError('FORBIDDEN', 403, 'Slot does not belong to your team');
    }

    const date = fromDateOnly(input.date);
    const lookback = 30;
    const from = addDaysUtc(date, -lookback);
    const to = addDaysUtc(date, lookback);

    const [activeMembers, inWindow, allShifts] = await Promise.all([
      this.members.findByTeam(me.teamId),
      this.shifts.findByDateRange(from, to),
      this.shifts.findByDateRange(addDaysUtc(date, -365), addDaysUtc(date, 365)),
    ]);

    const teamMembers = activeMembers.filter((m) => m.teamId === me.teamId);
    const candidates = teamMembers.map((member) => {
      const score = inWindow.filter(
        (s) => s.memberId === member.id && s.date >= from && s.date <= to,
      ).length;
      const totalShifts = allShifts.filter((s) => s.memberId === member.id).length;
      return { id: member.id, name: `${member.firstName} ${member.lastName}`, score, totalShifts };
    });

    const suggestion = suggestNextMember(teamMembers, inWindow, allShifts, date, { lookbackDays: 30 });

    return {
      shift: null,
      suggestedMember: suggestion
        ? {
            id: suggestion.member.id,
            name: `${suggestion.member.firstName} ${suggestion.member.lastName}`,
            score: suggestion.score,
            totalShifts: suggestion.totalShifts,
          }
        : { id: '', name: '', score: 0, totalShifts: 0 },
      allCandidates: candidates,
    };
  }
}
