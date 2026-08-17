import { DAY_NAMES } from '@css/shared';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class TimeValueObject {
  private constructor(readonly value: string) {}

  static from(value: string): TimeValueObject {
    if (!TIME_PATTERN.test(value)) {
      throw new Error(`Invalid time "${value}". Expected HH:mm.`);
    }
    return new TimeValueObject(value);
  }

  get hour(): number {
    return Number(this.value.slice(0, 2));
  }

  get minute(): number {
    return Number(this.value.slice(3, 5));
  }

  toMinutes(): number {
    return this.hour * 60 + this.minute;
  }

  isBefore(other: TimeValueObject): boolean {
    return this.toMinutes() < other.toMinutes();
  }

  isAfterOrEqual(other: TimeValueObject): boolean {
    return this.toMinutes() >= other.toMinutes();
  }
}

export class DayOfWeekValueObject {
  private constructor(readonly value: number) {}

  static from(value: number): DayOfWeekValueObject {
    if (!Number.isInteger(value) || value < 0 || value > 6) {
      throw new Error(`Invalid dayOfWeek "${value}". Expected 0 (Sunday) to 6 (Saturday).`);
    }
    return new DayOfWeekValueObject(value);
  }

  get name(): string {
    return DAY_NAMES[this.value] ?? 'Unknown';
  }
}
