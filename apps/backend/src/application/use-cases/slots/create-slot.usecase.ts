import { ApiError, SlotDto, SlotInput } from '@css/shared';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toSlotDto } from '../../mappers';
import { DayOfWeekValueObject, TimeValueObject } from '../../../domain/entities/value-objects';

export class CreateSlotUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly slots: SlotRepository,
  ) {}

  async execute(ctx: AuthContext, input: SlotInput): Promise<SlotDto> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can manage slots');
    }
    const coordinator = await this.users.findMemberByUserId(ctx.userId);
    if (!coordinator) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    // Validate value objects (domain invariant) even though Zod already checked shape.
    DayOfWeekValueObject.from(input.dayOfWeek);
    const start = TimeValueObject.from(input.startTime);
    const end = TimeValueObject.from(input.endTime);
    if (!start.isBefore(end)) {
      throw new ApiError('VALIDATION_ERROR', 400, 'startTime must be before endTime');
    }

    const slot = await this.slots.create({
      teamId: coordinator.teamId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      label: input.label,
      isActive: input.isActive ?? true,
    });

    return toSlotDto(slot);
  }
}
