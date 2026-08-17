import { ApiError } from '@css/shared';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { NotificationRepository } from '../../../domain/repositories/notification-repository';
import { AuthContext } from '../../auth-context';

export class DeleteMemberUseCase {
  constructor(
    private readonly members: MemberRepository,
    private readonly shifts: ShiftRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async execute(ctx: AuthContext, id: string): Promise<{ ok: true }> {
    const member = await this.members.findById(id);
    if (!member) throw new ApiError('NOT_FOUND', 404, 'Member not found');

    if (member.userId && member.userId === ctx.userId) {
      throw new ApiError('FORBIDDEN', 403, 'You cannot delete your own account');
    }

    if (ctx.role === 'MEMBER') {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can delete members');
    }

    if (ctx.role === 'COORDINATOR' && member.role !== 'MEMBER') {
      throw new ApiError(
        'FORBIDDEN',
        403,
        'Coordinators can only delete members with the MEMBER role',
      );
    }

    const shifts = await this.shifts.findByMemberId(id);
    if (shifts.length > 0 && ctx.role !== 'ADMIN') {
      throw new ApiError(
        'VALIDATION_ERROR',
        409,
        `This member has ${shifts.length} assignment${shifts.length === 1 ? '' : 's'}. Only an admin can delete a member with assignments.`,
      );
    }

    // Deleting the member cascades all their assignments in the database.
    await this.members.delete(id);

    if (ctx.role === 'ADMIN') {
      await this.notifications.create({
        userId: ctx.userId,
        title: 'Member deleted',
        body:
          shifts.length === 0
            ? `${member.firstName} ${member.lastName} was deleted.`
            : `${member.firstName} ${member.lastName} and their ${shifts.length} assignment${shifts.length === 1 ? '' : 's'} were deleted.`,
      });
    }

    return { ok: true };
  }
}
