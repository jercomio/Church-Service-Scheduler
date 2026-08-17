import { ApiError } from '@css/shared';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext } from '../../auth-context';

/**
 * AUTH-06 — deletes the caller's own account (and linked member profile).
 * An ADMIN may only leave once the ADMIN role has been handed to another
 * member, so the team keeps at least one admin.
 */
export class DeleteMyAccountUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
  ) {}

  async execute(ctx: AuthContext): Promise<{ ok: true }> {
    const me = await this.users.findMemberByUserId(ctx.userId);

    if (me) {
      if (me.role === 'ADMIN') {
        const teamMembers = await this.members.findByTeam(me.teamId);
        const anotherAdmin = teamMembers.some(
          (member) => member.role === 'ADMIN' && member.userId !== ctx.userId,
        );
        if (!anotherAdmin) {
          throw new ApiError(
            'VALIDATION_ERROR',
            409,
            'Assign the ADMIN role to another member before deleting your account.',
          );
        }
      }
      await this.members.delete(me.id);
    }

    await this.users.delete(ctx.userId);
    return { ok: true };
  }
}
