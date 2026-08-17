import { describe, expect, it } from 'vitest';
import { ShiftEntity } from '../../src/domain/entities/shift';
import { assertNoConflict, hasConflictingShift, ShiftConflictError } from '../../src/domain/services/shift-conflict.service';
import { fromDateOnly } from '../../src/domain/services/date-utils';

function makeShift(id: string, memberId: string, date: Date): ShiftEntity {
  return { id, slotId: 'slot-1', memberId, date, createdAt: new Date() };
}

describe('shift-conflict.service (PLAN-05)', () => {
  const date = fromDateOnly('2026-08-16');
  const otherDay = fromDateOnly('2026-08-17');

  it('detects a conflict when the member already has a shift that day', () => {
    const shifts = [makeShift('s1', 'm1', date), makeShift('s2', 'm2', date)];
    expect(hasConflictingShift('m1', date, shifts)).toBe(true);
    expect(() => assertNoConflict('m1', date, shifts)).toThrow(ShiftConflictError);
  });

  it('ignores shifts of other members', () => {
    const shifts = [makeShift('s1', 'm2', date)];
    expect(hasConflictingShift('m1', date, shifts)).toBe(false);
  });

  it('ignores shifts on other days', () => {
    const shifts = [makeShift('s1', 'm1', otherDay)];
    expect(hasConflictingShift('m1', date, shifts)).toBe(false);
  });

  it('allows updating the shift itself (ignores its own id)', () => {
    const shifts = [makeShift('s1', 'm1', date)];
    expect(hasConflictingShift('m1', date, shifts, 's1')).toBe(false);
  });
});
