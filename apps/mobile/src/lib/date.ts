import { DAY_NAMES, DAY_NAMES_SHORT } from '@css/shared';

export const MS_PER_DAY = 86_400_000;

export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Sunday-based start of week: dayOfWeek 0 = Sunday. */
export function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateOnly(a) === toDateOnly(b);
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatLongDate(value: string): string {
  return fromDateOnly(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? 'Unknown';
}

export function dayNameShort(dayOfWeek: number): string {
  return DAY_NAMES_SHORT[dayOfWeek] ?? 'Unknown';
}

export function relativeLabel(date: Date): string {
  const today = new Date();
  const diff = Math.round((date.getTime() - today.getTime()) / MS_PER_DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return formatDate(date);
}
