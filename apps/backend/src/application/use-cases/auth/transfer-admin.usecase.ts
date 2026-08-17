import { ApiError, MemberDto, TransferAdminInput } from '@css/shared';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { NotificationRepository } from '../../../domain/repositories/notification-repository';
import { TeamRepository } from '../../../domain/repositories/team-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext } from '../../auth-context';
import { toMemberDto } from '../../mappers';

/**
 * AUTH-04 — an ADMIN hands the ADMIN role to another member of the team, then
 * steps down or deletes their account. Every team member is notified about the
 * new ADMIN (in-app).
 */
export class TransferAdminUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly teams: TeamRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async execute(
    ctx: AuthContext,
    input: TransferAdminInput,
  ): Promise<{ ok: true; newAdmin: MemberDto }> {
    if (ctx.role !== 'ADMIN') {
      throw new ApiError('FORBIDDEN', 403, 'Only an admin can transfer the admin role');
    }

    const me = await this.users.findMemberByUserId(ctx.userId);
    if (!me) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    const target = await this.members.findById(input.newAdminMemberId);
    if (!target) throw new ApiError('NOT_FOUND', 404, 'Member not found');
    if (target.teamId !== me.teamId) {
      throw new ApiError('FORBIDDEN', 403, 'Member does not belong to your team');
    }
    if (target.userId === ctx.userId) {
      throw new ApiError('VALIDATION_ERROR', 400, 'You already hold the admin role');
    }
    if (target.role === 'ADMIN') {
      throw new ApiError('VALIDATION_ERROR', 400, 'This member is already an admin');
    }

    // Linked members get the role on their User row (drives access control);
    // unlinked members keep it on their Member row.
    if (target.userId) {
      await this.users.updateRole(target.userId, 'ADMIN');
    }
    await this.members.update(target.id, { role: 'ADMIN' });

    const team = await this.teams.findByMemberId(me.id);
    const teamName = team?.name ?? 'the team';
    const newAdminName = `${target.firstName} ${target.lastName}`.trim();

    const teamMembers = await this.members.findByTeam(me.teamId);
    for (const member of teamMembers) {
      if (!member.userId) continue;
      await this.notifications.create({
        userId: member.userId,
        title: 'New administrator',
        body: `${newAdminName} is now the administrator of ${teamName}.`,
      });
    }

    const updated = await this.members.findById(target.id);
    return { ok: true, newAdmin: toMemberDto(updated ?? target) };
  }
}
