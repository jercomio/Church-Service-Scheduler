import { ApiError, MemberDto, MemberUpdateInput, Role } from '@css/shared';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { NotificationRepository } from '../../../domain/repositories/notification-repository';
import { TeamRepository } from '../../../domain/repositories/team-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toMemberDto } from '../../mappers';

export class UpdateMemberUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly teams: TeamRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async execute(ctx: AuthContext, id: string, input: MemberUpdateInput): Promise<MemberDto> {
    const existing = await this.members.findById(id);
    if (!existing) throw new ApiError('NOT_FOUND', 404, 'Member not found');

    if (!isManagerRole(ctx.role)) {
      const me = await this.users.findMemberByUserId(ctx.userId);
      if (!me || me.id !== id) {
        throw new ApiError('FORBIDDEN', 403, 'You can only update your own profile');
      }
      if (input.role !== undefined || input.isActive !== undefined || input.email !== undefined) {
        throw new ApiError('FORBIDDEN', 403, 'You cannot change role, status or email');
      }
    } else {
      // A COORDINATOR cannot manage an ADMIN member.
      if (ctx.role === 'COORDINATOR' && existing.role === 'ADMIN') {
        throw new ApiError('FORBIDDEN', 403, 'Only an admin can manage admin members');
      }
      // The ADMIN role can only be granted manually in the database.
      if ((input.role as string) === 'ADMIN') {
        throw new ApiError('FORBIDDEN', 403, 'The admin role can only be granted in the database');
      }
    }

    const normalize = (value: string | undefined): string | null | undefined =>
      value === undefined ? undefined : value ? value : null;

    const data: Parameters<MemberRepository['update']>[1] = {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: normalize(input.phone),
      address: normalize(input.address),
      avatarUrl: normalize(input.avatarUrl),
    };

    if (isManagerRole(ctx.role)) {
      data.email = input.email !== undefined ? (input.email ? input.email : null) : undefined;
      data.isActive = input.isActive;
      // Persisted on the member so unlinked members keep their role too.
      data.role = input.role;
    }

    const updated = await this.members.update(id, data);

    if (isManagerRole(ctx.role)) {
      const nextRole: Role | undefined = input.role;
      if (nextRole && existing.userId && nextRole !== existing.role) {
        await this.users.updateRole(existing.userId, nextRole);

        const memberName = `${existing.firstName} ${existing.lastName}`.trim();
        const team = await this.teams.findByMemberId(existing.id);
        const teamName = team?.name ?? 'the team';
        const title = nextRole === 'COORDINATOR' ? 'New coordinator' : 'Role update';
        const body =
          nextRole === 'COORDINATOR'
            ? `${memberName} is now the coordinator of ${teamName}.`
            : `${memberName} is now a member of ${teamName}.`;

        const teamMembers = await this.members.findByTeam(existing.teamId);
        for (const member of teamMembers) {
          if (!member.userId) continue;
          await this.notifications.create({ userId: member.userId, title, body });
        }
      }
    }

    if (!updated) throw new ApiError('NOT_FOUND', 404, 'Member not found');
    return toMemberDto({
      ...existing,
      ...updated,
      role: input.role ?? existing.role,
    });
  }
}
