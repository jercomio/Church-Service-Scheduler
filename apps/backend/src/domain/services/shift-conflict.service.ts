import { ShiftEntity } from '../entities/shift';
import { isSameDay } from './date-utils';

export class ShiftConflictError extends Error {
  constructor(
    readonly memberId: string,
    readonly date: Date,
  ) {
    super(`Member ${memberId} is already assigned to another slot on ${date.toISOString()}`);
    this.name = 'ShiftConflictError';
  }
}

/**
 * PLAN-05 — Non-conflict rule: a member cannot be assigned to two slots on the
 * same day. Returns true when a shift already exists for `memberId` on `date`.
 */
export function hasConflictingShift(
  memberId: string,
  date: Date,
  existingShifts: readonly ShiftEntity[],
  ignoreShiftId?: string,
): boolean {
  return existingShifts.some(
    (shift) =>
      shift.memberId === memberId &&
      isSameDay(shift.date, date) &&
      shift.id !== ignoreShiftId,
  );
}

export function assertNoConflict(
  memberId: string,
  date: Date,
  existingShifts: readonly ShiftEntity[],
  ignoreShiftId?: string,
): void {
  if (hasConflictingShift(memberId, date, existingShifts, ignoreShiftId)) {
    throw new ShiftConflictError(memberId, date);
  }
}
