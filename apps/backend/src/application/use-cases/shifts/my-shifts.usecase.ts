import { ShiftDto } from '@css/shared';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext } from '../../auth-context';
import { toShiftDto } from '../../mappers';
import { addDaysUtc, fromDateOnly } from '../../../domain/services/date-utils';

export class GetMyShiftsUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
  ) {}

  async execute(
    ctx: AuthContext,
    query: { from: string; to?: string },
  ): Promise<ShiftDto[]> {
    const member = await this.users.findMemberByUserId(ctx.userId);
    if (!member) return [];

    const from = fromDateOnly(query.from);
    const to = query.to ? fromDateOnly(query.to) : addDaysUtc(from, 60);

    const [shifts, slots] = await Promise.all([
      this.shifts.findForMemberInRange(member.id, from, to),
      this.slots.findByTeam(member.teamId),
    ]);
    const slotsById = new Map(slots.map((slot) => [slot.id, slot]));

    return shifts
      .map((shift) => toShiftDto(shift, { slot: slotsById.get(shift.slotId), member }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
