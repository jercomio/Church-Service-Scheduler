import { ApiError, TeamDto } from '@css/shared';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toMemberDto, toSlotDto } from '../../mappers';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { TeamRepository } from '../../../domain/repositories/team-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';

export class GetTeamUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly teams: TeamRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
  ) {}

  /** Only coordinators and admins can read the full team (members + slots). */
  async execute(ctx: AuthContext): Promise<TeamDto> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can access team data');
    }

    const member = await this.users.findMemberByUserId(ctx.userId);
    if (!member) {
      throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');
    }

    const team = await this.teams.findByMemberId(member.id);
    if (!team) {
      throw new ApiError('TEAM_NOT_FOUND', 404, 'Team not found');
    }

    const [members, slots] = await Promise.all([
      this.members.findByTeam(team.id),
      this.slots.findByTeam(team.id),
    ]);

    return { id: team.id, name: team.name, members: members.map(toMemberDto), slots: slots.map(toSlotDto) };
  }
}
