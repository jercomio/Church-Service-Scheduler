import { ApiError, MemberDto, MemberInput } from '@css/shared';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toMemberDto } from '../../mappers';

export class CreateMemberUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
  ) {}

  async execute(ctx: AuthContext, input: MemberInput): Promise<MemberDto> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can manage members');
    }
    const coordinator = await this.users.findMemberByUserId(ctx.userId);
    if (!coordinator) {
      throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');
    }

    const member = await this.members.create({
      teamId: coordinator.teamId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ? input.email : null,
      isActive: input.isActive ?? true,
    });

    return toMemberDto(member);
  }
}
