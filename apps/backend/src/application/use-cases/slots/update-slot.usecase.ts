import { ApiError, SlotDto, SlotUpdateInput } from '@css/shared';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { toSlotDto } from '../../mappers';

export class UpdateSlotUseCase {
  constructor(private readonly slots: SlotRepository) {}

  async execute(ctx: AuthContext, id: string, input: SlotUpdateInput): Promise<SlotDto> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can manage slots');
    }
    const existing = await this.slots.findById(id);
    if (!existing) throw new ApiError('NOT_FOUND', 404, 'Slot not found');

    const updated = await this.slots.update(id, {
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      label: input.label,
      isActive: input.isActive,
    });

    if (!updated) throw new ApiError('NOT_FOUND', 404, 'Slot not found');
    return toSlotDto(updated);
  }
}
