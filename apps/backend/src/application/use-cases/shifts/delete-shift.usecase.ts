import { ApiError } from '@css/shared';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { AuthContext, isManagerRole } from '../../auth-context';
import { ShiftNotifier } from '../../services/shift-notifier';

export class DeleteShiftUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
    private readonly shifts: ShiftRepository,
    private readonly notifier: ShiftNotifier,
  ) {}

  async execute(ctx: AuthContext, id: string): Promise<{ ok: true }> {
    const shift = await this.shifts.findById(id);
    if (!shift) throw new ApiError('NOT_FOUND', 404, 'Shift not found');

    const me = await this.users.findMemberByUserId(ctx.userId);
    if (!me) throw new ApiError('TEAM_NOT_FOUND', 404, 'No team profile linked to this account');

    if (!isManagerRole(ctx.role)) {
      // A regular member can only remove their own assignments.
      if (shift.memberId !== me.id) {
        throw new ApiError('FORBIDDEN', 403, 'You can only delete your own assignments');
      }
    } else {
      const assigned = await this.members.findById(shift.memberId);
      if (!assigned || assigned.teamId !== me.teamId) {
        throw new ApiError('FORBIDDEN', 403, 'Shift does not belong to your team');
      }
    }

    const [slot, member] = await Promise.all([
      this.slots.findById(shift.slotId),
      this.members.findById(shift.memberId),
    ]);

    await this.shifts.delete(id);

    if (slot && member) {
      await this.notifier.notifyCancelled(shift, slot, member);
    }

    return { ok: true };
  }
}
