import { ApiError, MemberDto } from '@css/shared';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toMemberDto } from '../../mappers';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';

export class ListMembersUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly shifts: ShiftRepository,
  ) {}

  async execute(ctx: AuthContext): Promise<MemberDto[]> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can list members');
    }
    const member = await this.users.findMemberByUserId(ctx.userId);
    if (!member) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    const members = await this.members.findByTeam(member.teamId);
    const counts = await this.shifts.countByMemberIds(members.map((m) => m.id));

    return members.map((m) => ({
      ...toMemberDto(m),
      shiftCount: counts.get(m.id) ?? 0,
    }));
  }
}
