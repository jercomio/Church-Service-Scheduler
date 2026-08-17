import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ShiftDto } from '@css/shared';
import { cn } from '@/lib/utils';

/**
 * One pleasant solid colour per month (classic palette, scale 9). The palette
 * sweeps the wheel from red to orange so adjacent months stay distinguishable.
 * @see https://www.radix-ui.com/colors
 */
const MONTH_COLORS = [
  '#E5484D', // red     - Jan
  '#E93D82', // crimson - Feb
  '#D6409F', // pink    - Mar
  '#AB4ABA', // plum    - Apr
  '#6E56CF', // violet  - May
  '#3E63DD', // indigo  - Jun
  '#0090FF', // blue    - Jul
  '#00A2C7', // cyan    - Aug
  '#12A594', // teal    - Sep
  '#30A46C', // green   - Oct
  '#FFB224', // amber   - Nov
  '#F76B15', // orange  - Dec
];

const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const BAR_HEIGHT = 28;
const SECTION_WIDTH = 18;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function relativeLuminance(hex: string): number {
  const channels = [0, 2, 4].map((i) => {
    const v = parseInt(hex.slice(i + 1, i + 3), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function textColorFor(hex: string): string {
  return relativeLuminance(hex) > 0.35 ? '#1f2937' : '#ffffff';
}

interface Bar {
  month: number;
  letter: string;
  color: string;
  days: { day: number; shift: ShiftDto | null }[];
}

interface MonthBarChartProps {
  shifts: ShiftDto[];
  year: number;
  onSelectShift: (shift: ShiftDto) => void;
  className?: string;
}

/**
 * Horizontal segmented bar chart of the year, shaped like the Shadcn "Bar
 * Chart - Mixed" example: one pill bar per month (category labels on the left).
 * Each bar is split into equal, fixed-size segments — one per day of that month
 * — that scroll horizontally so every day stays reachable. A segment is filled
 * with its month's colour when the member has an assignment that day. Filled
 * segments are tappable and report the underlying assignment.
 */
export function MonthBarChart({ shifts, year, onSelectShift, className }: MonthBarChartProps) {
  const bars = useMemo<Bar[]>(() => {
    const byDay = new Map<string, ShiftDto>();
    for (const shift of shifts) {
      if (!byDay.has(shift.date)) byDay.set(shift.date, shift);
    }

    return Array.from({ length: 12 }, (_, m) => {
      const month = m + 1;
      const days = new Date(year, month, 0).getDate();
      const daySections = Array.from({ length: days }, (_, i) => {
        const day = i + 1;
        return {
          day,
          shift: byDay.get(`${year}-${pad2(month)}-${pad2(day)}`) ?? null,
        };
      });
      return {
        month,
        letter: MONTH_LETTERS[m] ?? '',
        color: MONTH_COLORS[m] ?? '#6b7280',
        days: daySections,
      };
    });
  }, [shifts, year]);

  return (
    <View className={cn('w-full', className)}>
      <View className="flex-row">
        <View className="mr-2 gap-y-1">
          {bars.map((bar) => (
            <View key={bar.month} className="justify-center" style={{ height: BAR_HEIGHT }}>
              <Text className="text-xs font-semibold text-muted-foreground">{bar.letter}</Text>
            </View>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
        >
          <View className="gap-y-1">
            {bars.map((bar) => {
              const dayText = textColorFor(bar.color);
              return (
                <View
                  key={bar.month}
                  className="flex-row overflow-hidden rounded-full border border-border bg-muted/40"
                  style={{ height: BAR_HEIGHT }}
                >
                  {bar.days.map((section, index) => {
                    const filled = section.shift !== null;
                    const isLast = index === bar.days.length - 1;
                    const cell = (
                      <View
                        className="h-full items-center justify-center"
                        style={{
                          width: SECTION_WIDTH,
                          backgroundColor: filled
                            ? bar.color
                            : section.day % 2 === 1
                              ? 'rgba(0,0,0,0.06)'
                              : 'transparent',
                          borderRightWidth: isLast ? 0 : 1,
                          borderRightColor: filled
                            ? 'rgba(255,255,255,0.35)'
                            : 'rgba(0,0,0,0.08)',
                        }}
                      >
                        <Text
                          className="text-[9px] font-semibold"
                          style={{ color: filled ? dayText : '#9ca3af' }}
                        >
                          {section.day}
                        </Text>
                      </View>
                    );
                    return filled && section.shift ? (
                      <Pressable
                        key={section.day}
                        onPress={() => onSelectShift(section.shift as ShiftDto)}
                        accessibilityRole="button"
                        accessibilityLabel={`Assignment on ${bar.month}/${section.day}`}
                      >
                        {cell}
                      </Pressable>
                    ) : (
                      <View key={section.day}>{cell}</View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
