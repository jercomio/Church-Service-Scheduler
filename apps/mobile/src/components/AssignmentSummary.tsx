import { useMemo } from 'react';
import { Text, View } from 'react-native';
import type { ShiftDto } from '@css/shared';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_ABBREV = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Stable, distinct base hue per month (derived from the month key). */
function monthHue(monthKey: string): number {
  const [, month] = monthKey.split('-').map(Number);
  return ((month ?? 0) * 53 + 190) % 360;
}

/** Solid base colour of the month, used for the badges' borders. */
function monthBase(monthKey: string): string {
  return `hsl(${monthHue(monthKey)}, 70%, 50%)`;
}

function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year ?? 2000, (month ?? 1), 0).getDate();
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = l - c / 2;
  const [r, g, b]: [number, number, number] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** WCAG relative luminance so text colour is chosen per badge, not guessed. */
function relativeLuminance(h: number, s: number, l: number): number {
  const [r, g, b] = hslToRgb(h, s, l).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Gradient badge: day 1 is the darkest shade of the month and the last day of
 * the month the lightest. The border always uses the month's solid base colour
 * so every badge stays readable against the background, even when the light
 * fills blend into it.
 */
function badgeColors(
  monthKey: string,
  day: number,
): { bg: string; border: string; fg: string } {
  const hue = monthHue(monthKey);
  const total = daysInMonth(monthKey);
  const t = total > 1 ? (day - 1) / (total - 1) : 0;
  const lightness = 32 + Math.round(t * 56); // 32% (dark) .. 88% (light)
  const lum = relativeLuminance(hue, 0.7, lightness / 100);
  return {
    bg: `hsl(${hue}, 70%, ${lightness}%)`,
    border: monthBase(monthKey),
    fg: lum < 0.2 ? '#ffffff' : '#1f2937',
  };
}

interface MonthGroup {
  key: string;
  label: string;
  days: number[];
}

interface AssignmentSummaryProps {
  shifts: ShiftDto[];
  className?: string;
}

/**
 * Presents a member's assignments as a column of months, each with circular
 * day badges laid out horizontally. Every badge is tinted with its month's
 * colour, shaded progressively towards the end of the month.
 */
export function AssignmentSummary({ shifts, className }: AssignmentSummaryProps) {
  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, Set<number>>();
    for (const shift of shifts) {
      const monthKey = shift.date.slice(0, 7);
      const day = Number(shift.date.slice(8, 10));
      if (Number.isNaN(day)) continue;
      const set = map.get(monthKey) ?? new Set<number>();
      set.add(day);
      map.set(monthKey, set);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, days]) => {
        const [year, month] = key.split('-').map(Number);
        const fullLabel = `${MONTH_NAMES[((month ?? 0) - 1) % 12] ?? ''} ${year ?? ''}`;
        const shortLabel = `${MONTH_ABBREV[((month ?? 0) - 1) % 12] ?? ''} ${year ?? ''}`;
        return {
          key,
          label: days.size > 4 ? shortLabel : fullLabel,
          days: [...days].sort((a, b) => a - b),
        };
      });
  }, [shifts]);

  if (groups.length === 0) {
    return (
      <Text className="text-sm text-muted-foreground">No assignments to show.</Text>
    );
  }

  return (
    <View className={cn('gap-3', className)}>
      {groups.map((group) => (
        <View key={group.key} className="flex-row items-start gap-3">
          <Text className="mt-1.5 w-24 shrink-0 text-sm font-medium text-foreground">
            {group.label}
          </Text>
          <View className="flex-1 flex-row flex-wrap gap-1.5">
            {group.days.map((day) => {
              const { bg, border, fg } = badgeColors(group.key, day);
              return (
                <View
                  key={day}
                  style={{ backgroundColor: bg, borderColor: border }}
                  className="h-8 w-8 items-center justify-center rounded-full border"
                >
                  <Text style={{ color: fg }} className="text-xs font-semibold">
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
