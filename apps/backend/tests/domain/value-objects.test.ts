import { describe, expect, it } from 'vitest';
import { DayOfWeekValueObject, TimeValueObject } from '../../src/domain/entities/value-objects';
import {
  addDaysUtc,
  fromDateOnly,
  isSameDay,
  startOfMonthUtc,
  startOfWeekUtc,
  toDateOnly,
} from '../../src/domain/services/date-utils';

describe('TimeValueObject', () => {
  it('accepts valid HH:mm values', () => {
    expect(TimeValueObject.from('09:00').toMinutes()).toBe(540);
    expect(TimeValueObject.from('23:59').toMinutes()).toBe(1439);
  });

  it('rejects invalid values', () => {
    expect(() => TimeValueObject.from('9:00')).toThrow();
    expect(() => TimeValueObject.from('25:00')).toThrow();
    expect(() => TimeValueObject.from('09:61')).toThrow();
  });

  it('compares correctly', () => {
    expect(TimeValueObject.from('09:00').isBefore(TimeValueObject.from('10:00'))).toBe(true);
    expect(TimeValueObject.from('19:00').isAfterOrEqual(TimeValueObject.from('19:00'))).toBe(true);
  });
});

describe('DayOfWeekValueObject', () => {
  it('maps 0..6 to day names', () => {
    expect(DayOfWeekValueObject.from(0).name).toBe('Sunday');
    expect(DayOfWeekValueObject.from(3).name).toBe('Wednesday');
  });

  it('rejects out of range values', () => {
    expect(() => DayOfWeekValueObject.from(7)).toThrow();
    expect(() => DayOfWeekValueObject.from(-1)).toThrow();
  });
});

describe('date-utils', () => {
  it('round-trips date-only strings', () => {
    const date = fromDateOnly('2026-08-16');
    expect(toDateOnly(date)).toBe('2026-08-16');
  });

  it('returns Sunday as the start of the week', () => {
    const wednesday = fromDateOnly('2026-08-19');
    const start = startOfWeekUtc(wednesday);
    expect(toDateOnly(start)).toBe('2026-08-16');
  });

  it('returns month bounds', () => {
    const start = startOfMonthUtc(fromDateOnly('2026-08-16'));
    expect(toDateOnly(start)).toBe('2026-08-01');
  });

  it('adds days in UTC', () => {
    expect(toDateOnly(addDaysUtc(fromDateOnly('2026-08-31'), 1))).toBe('2026-09-01');
  });

  it('detects same-day', () => {
    expect(isSameDay(fromDateOnly('2026-08-16'), fromDateOnly('2026-08-16'))).toBe(true);
    expect(isSameDay(fromDateOnly('2026-08-16'), fromDateOnly('2026-08-17'))).toBe(false);
  });
});
