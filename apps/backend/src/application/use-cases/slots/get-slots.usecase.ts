import { ApiError, SlotDto } from '@css/shared';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toSlotDto } from '../../mappers';

export class GetSlotsUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly slots: SlotRepository,
  ) {}

  async execute(ctx: AuthContext): Promise<SlotDto[]> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can view service slots');
    }
    const member = await this.users.findMemberByUserId(ctx.userId);
    if (!member) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');
    const slots = await this.slots.findByTeam(member.teamId);
    return slots.map(toSlotDto);
  }
}
