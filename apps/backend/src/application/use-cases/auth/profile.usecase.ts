import { UserProfileDto } from '@css/shared';
import { MemberEntity } from '../../../domain/entities/member';
import { SlotEntity } from '../../../domain/entities/slot';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { TeamRepository } from '../../../domain/repositories/team-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { addDaysUtc } from '../../../domain/services/date-utils';
import { AuthContext } from '../../auth-context';
import { toMemberDto, toShiftDto, toSlotDto, toUserDto } from '../../mappers';

export class GetProfileUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly teams: TeamRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
  ) {}

  async execute(ctx: AuthContext): Promise<UserProfileDto> {
    const user = await this.users.findById(ctx.userId);
    if (!user) throw new Error(`User ${ctx.userId} not found`);

    const member = await this.users.findMemberByUserId(ctx.userId);
    const isManager = ctx.role === 'ADMIN' || ctx.role === 'COORDINATOR';

    let teamSlots: SlotEntity[] = [];
    let members: MemberEntity[] = [];
    let teamName = 'My Team';
    if (member) {
      const team = await this.teams.findByMemberId(member.id);
      if (team) {
        teamName = team.name;
        teamSlots = await this.slots.findByTeam(team.id);
        // Regular members must not see the other members of the team.
        members = isManager ? await this.members.findByTeam(team.id) : [member];
      }
    }

    const now = new Date();
    const horizon = addDaysUtc(now, 60);
    const NEXT_SHIFTS_COUNT = 2;
    let nextShift = null;
    let nextShifts: ReturnType<typeof toShiftDto>[] = [];
    let upcomingShifts = 0;
    let totalShifts = 0;

    if (member) {
      totalShifts = (await this.shifts.findByMemberId(member.id)).length;
      const upcoming = await this.shifts.findForMemberInRange(member.id, now, horizon);
      upcomingShifts = upcoming.length;
      const future = upcoming
        .filter((shift) => shift.date >= now)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      const slotsById = new Map(teamSlots.map((slot) => [slot.id, slot]));

      if (ctx.role === 'MEMBER') {
        // Members see the next services for the whole team, with who is scheduled.
        const teamMembers = await this.members.findByTeam(member.teamId);
        const membersById = new Map(teamMembers.map((m) => [m.id, m]));
        const teamFuture = (await this.shifts.findByDateRange(now, horizon))
          .filter((shift) => membersById.has(shift.memberId))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        nextShifts = teamFuture.slice(0, NEXT_SHIFTS_COUNT).map((candidate) =>
          toShiftDto(candidate, {
            slot: slotsById.get(candidate.slotId),
            member: membersById.get(candidate.memberId),
          }),
        );
      } else {
        nextShifts = future
          .slice(0, NEXT_SHIFTS_COUNT)
          .map((candidate) => toShiftDto(candidate, { slot: slotsById.get(candidate.slotId), member }));
      }
      nextShift = nextShifts[0] ?? null;
    }

    return {
      user: toUserDto(user),
      team: member
        ? {
            id: (await this.teams.findByMemberId(member.id))?.id ?? '',
            name: teamName,
            members: members.map(toMemberDto),
            slots: teamSlots.map(toSlotDto),
          }
        : undefined,
      nextShift,
      nextShifts,
      stats: { totalShifts, upcomingShifts },
    };
  }
}
