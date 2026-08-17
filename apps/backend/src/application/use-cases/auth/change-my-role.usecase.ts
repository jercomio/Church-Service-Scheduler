import { ApiError, ChangeRoleInput, UserDto } from '@css/shared';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext } from '../../auth-context';
import { toUserDto } from '../../mappers';

/**
 * AUTH-05 — an ADMIN can downgrade their own role to COORDINATOR or MEMBER.
 * The team must keep at least one ADMIN, so the role can only be changed once
 * the ADMIN role has been handed to another member.
 */
export class ChangeMyRoleUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
  ) {}

  async execute(ctx: AuthContext, input: ChangeRoleInput): Promise<{ user: UserDto }> {
    if (ctx.role !== 'ADMIN') {
      throw new ApiError('FORBIDDEN', 403, 'Only an admin can change their own role');
    }

    const me = await this.users.findMemberByUserId(ctx.userId);
    if (!me) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    const teamMembers = await this.members.findByTeam(me.teamId);
    const anotherAdmin = teamMembers.some(
      (member) => member.role === 'ADMIN' && member.userId !== ctx.userId,
    );
    if (!anotherAdmin) {
      throw new ApiError(
        'VALIDATION_ERROR',
        409,
        'Assign the ADMIN role to another member before changing your role.',
      );
    }

    const user = await this.users.updateRole(ctx.userId, input.role);
    return { user: toUserDto(user) };
  }
}
