export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const ROLE = {
  ADMIN: 'ADMIN',
  COORDINATOR: 'COORDINATOR',
  MEMBER: 'MEMBER',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type DayOfWeek = (typeof WEEK_DAYS)[number];

export const DEFAULT_SLOTS = [
  { dayOfWeek: 0, startTime: '09:00', endTime: '12:00', label: 'Sunday Morning Worship' },
  { dayOfWeek: 3, startTime: '19:00', endTime: '21:00', label: 'Wednesday Bible Study' },
] as const;

export const REMINDER_DAYS_BEFORE = [7, 1] as const;

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
