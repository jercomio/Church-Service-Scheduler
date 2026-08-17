import { ApiError } from '@css/shared';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { AuthContext, isManagerRole } from '../../auth-context';

export class DeleteSlotUseCase {
  constructor(
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
  ) {}

  async execute(ctx: AuthContext, id: string): Promise<{ ok: true }> {
    if (!isManagerRole(ctx.role)) {
      throw new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can manage slots');
    }
    const slot = await this.slots.findById(id);
    if (!slot) throw new ApiError('NOT_FOUND', 404, 'Slot not found');

    const shifts = await this.shifts.findBySlotId(id);
    if (shifts.some((shift) => shift.date >= new Date())) {
      throw new ApiError(
        'VALIDATION_ERROR',
        409,
        'This slot still has upcoming shifts. Reassign them before deleting.',
      );
    }

    await this.slots.delete(id);
    return { ok: true };
  }
}
