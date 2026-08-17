import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, ArrowRight, CalendarDays, Plus, Sparkles, Trash2 } from 'lucide-react-native';
import type { ShiftDto, SlotDto } from '@css/shared';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, SheetItem } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateShifts, useDeleteShift } from '@/hooks/mutations';
import {
  useMembers,
  useShiftSuggestions,
  useShifts,
  useSlots,
} from '@/hooks/queries';
import {
  addDays,
  dayNameShort,
  formatDate,
  formatLongDate,
  fromDateOnly,
  isSameDay,
  startOfWeek,
  toDateOnly,
} from '@/lib/date';
import { avatarColor, cn, initials } from '@/lib/utils';
import { ApiError, api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type { SuggestShiftResult } from '@/hooks/queries';

type ViewMode = 'week' | 'month';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MAX_INITIALS_PER_DAY = 3;

function hasSlotOn(slots: SlotDto[] | undefined, dayOfWeek: number) {
  return (slots ?? []).some((s) => s.dayOfWeek === dayOfWeek && s.isActive !== false);
}

function shiftMemberName(shift: ShiftDto) {
  return `${shift.member?.firstName ?? ''} ${shift.member?.lastName ?? ''}`.trim() || 'this member';
}

export default function PlanningScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));

  const weekStart = startOfWeek(anchor);
  const monthKey = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`;

  const { data: slots } = useSlots();
  const { data: members } = useMembers();
  const createShifts = useCreateShifts();
  const deleteShift = useDeleteShift();

  const [modalOpen, setModalOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [returnToDetail, setReturnToDetail] = useState(false);
  const [detailShift, setDetailShift] = useState<ShiftDto | null>(null);

  const { data: suggestion } = useShiftSuggestions(draftDate, slotId);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // Stable month-scoped keys: switching Week/Month or navigating within a
  // cached month never refetches; only crossing into a new month does.
  const months = useMemo(() => {
    if (viewMode === 'month') return [monthKey];
    return [
      ...new Set(
        weekDays.map(
          (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        ),
      ),
    ].sort();
  }, [viewMode, weekDays, monthKey]);

  const { data: weekShifts, isLoading } = useShifts(months);

  const monthCells = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [anchor]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, typeof weekShifts>();
    for (const shift of weekShifts ?? []) {
      const list = map.get(shift.date) ?? [];
      list.push(shift);
      map.set(shift.date, list);
    }
    return map;
  }, [weekShifts]);

  const detailShifts = detailDate ? (shiftsByDate.get(detailDate) ?? []) : [];

  function moveAnchor(delta: number) {
    if (viewMode === 'week') {
      setAnchor(addDays(anchor, delta * 7));
    } else {
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));
    }
  }

  function openAssign(date: Date) {
    setDraftDate(toDateOnly(date));
    setSlotId(null);
    setMemberIds([]);
    setError(null);
    setReturnToDetail(false);
    setModalOpen(true);
  }

  function openDayDetail(date: Date) {
    setDetailDate(toDateOnly(date));
  }

  function openAssignFromDetail() {
    if (!detailDate) return;
    setDraftDate(detailDate);
    setSlotId(null);
    setMemberIds([]);
    setError(null);
    setReturnToDetail(true);
    setDetailDate(null);
    setModalOpen(true);
  }

  function toggleMember(id: string) {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  function closeAssignModal() {
    setModalOpen(false);
    if (returnToDetail && draftDate) {
      setReturnToDetail(false);
      setDetailDate(draftDate);
    }
  }

  function confirmDeleteShift(shiftId: string, memberName: string, onConfirm?: () => void) {
    Alert.alert(
      'Remove assignment',
      `Remove ${memberName} from this day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onConfirm?.();
            void deleteShift.mutateAsync(shiftId);
          },
        },
      ],
    );
  }

  function onSubmit() {
    if (!draftDate || !slotId || memberIds.length === 0) return;
    if (createShifts.isPending) return;
    setError(null);
    createShifts.mutate(
      { date: draftDate, slotId, memberIds },
      {
        onError: (e) =>
          Alert.alert(
            'Could not create the shift',
            e instanceof ApiError ? e.message : 'Please try again.',
          ),
      },
    );
    closeAssignModal();
  }

  const headerLabel =
    viewMode === 'week'
      ? formatDate(weekStart, { year: 'numeric' })
      : `${MONTH_LABELS[anchor.getMonth()]} ${anchor.getFullYear()}`;

  const sortedSlots = useMemo(
    () =>
      [...(slots ?? [])].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
      ),
    [slots],
  );

  const suggestedId = suggestion?.suggestedMember.id;
  const sortedCandidates = suggestion
    ? [...suggestion.allCandidates].sort((a, b) => a.score - b.score || a.totalShifts - b.totalShifts)
    : [];

  // Pre-warm the suggestion for the day's default slot so the member list with
  // scores shows instantly once a slot is picked.
  useEffect(() => {
    if (!modalOpen || !draftDate) return;
    const day = fromDateOnly(draftDate).getDay();
    const defaultSlot = sortedSlots.find(
      (s) => s.dayOfWeek === day && s.isActive !== false,
    );
    if (!defaultSlot) return;
    void queryClient.prefetchQuery({
      queryKey: ['shifts', 'suggest', draftDate, defaultSlot.id],
      queryFn: () =>
        api.post<SuggestShiftResult>('/shifts/suggest', {
          date: draftDate,
          slotId: defaultSlot.id,
        }),
      staleTime: 30_000,
    });
  }, [modalOpen, draftDate, sortedSlots]);

  return (
    <Screen className="pt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">Planning</Text>
        <Button size="sm" onPress={() => openAssign(new Date())}>
          <Plus size={16} className="text-primary-foreground" />
          Assign
        </Button>
      </View>

      <View className="mt-4">
        <SegmentedControl
          options={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
          value={viewMode}
          onValueChange={setViewMode}
        />
      </View>

      <View className="mt-4 flex-row items-center justify-between">
        <Pressable onPress={() => moveAnchor(-1)} hitSlop={8} className="rounded-full p-1 active:bg-muted" accessibilityLabel="Previous">
          <ArrowLeft size={20} className="text-foreground" />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">{headerLabel}</Text>
        <Pressable onPress={() => moveAnchor(1)} hitSlop={8} className="rounded-full p-1 active:bg-muted" accessibilityLabel="Next">
          <ArrowRight size={20} className="text-foreground" />
        </Pressable>
      </View>

      {isLoading ? (
        <Spinner />
      ) : viewMode === 'week' ? (
        <ScrollView
          className="mt-4 flex-1"
          contentContainerClassName="gap-3 pb-8"
          showsVerticalScrollIndicator={false}
        >
          {weekDays.map((day) => {
            const dateKey = toDateOnly(day);
            const dayShifts = shiftsByDate.get(dateKey) ?? [];
            return (
              <Card
                key={dateKey}
                className={cn(hasSlotOn(slots, day.getDay()) && 'bg-accent/60')}
              >
                <CardContent className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-foreground">
                      {dayNameShort(day.getDay())} · {formatDate(day)}
                    </Text>
                    <Pressable
                      onPress={() => openAssign(day)}
                      hitSlop={6}
                      accessibilityLabel={`Assign on ${formatDate(day)}`}
                    >
                      <Plus size={16} className="text-primary" />
                    </Pressable>
                  </View>
                  {dayShifts.length === 0 ? (
                    <Text className="text-sm text-muted-foreground">No shifts scheduled</Text>
                  ) : (
                    dayShifts.map((shift) => (
                      <SwipeableRow
                        key={shift.id}
                        onPress={() => setDetailShift(shift)}
                        onDelete={() => confirmDeleteShift(shift.id, shiftMemberName(shift))}
                        accessibilityLabel="Remove assignment"
                      >
                        <View className="flex-row items-center justify-between px-3 py-2">
                          <View className="flex-1">
                            <Text className="text-sm text-foreground">
                              {shift.slot?.label ?? 'Service'}
                            </Text>
                            {shift.slot ? (
                              <Text className="text-xs text-muted-foreground">
                                {shift.slot.startTime} – {shift.slot.endTime}
                              </Text>
                            ) : null}
                          </View>
                          <Text className="text-sm font-medium text-primary">
                            {shift.member?.firstName} {shift.member?.lastName}
                          </Text>
                        </View>
                      </SwipeableRow>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </ScrollView>
      ) : (
        <View className="mt-4 gap-1">
          <View className="flex-row gap-1">
            {DAY_INITIALS.map((initial, index) => (
              <Text
                key={`${initial}-${index}`}
                className="flex-1 text-center text-xs font-medium text-muted-foreground"
              >
                {initial}
              </Text>
            ))}
          </View>
          {Array.from({ length: 6 }, (_, row) => (
            <View key={row} className="flex-row gap-1">
              {monthCells.slice(row * 7, row * 7 + 7).map((day) => {
                const dateKey = toDateOnly(day);
                const dayShifts = (shiftsByDate.get(dateKey) ?? []).filter(
                  (s) => s.member,
                );
                const inMonth = day.getMonth() === anchor.getMonth();
                return (
                  <Pressable
                    key={dateKey}
                    onPress={() => openDayDetail(day)}
                    className={cn(
                      'flex-1 min-h-16 rounded-md border border-border p-1 active:bg-muted',
                      !inMonth && 'opacity-40',
                      isSameDay(day, new Date()) && 'border-primary',
                      hasSlotOn(slots, day.getDay()) && 'bg-accent/50',
                    )}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-medium text-foreground">
                        {day.getDate()}
                      </Text>
                      {dayShifts.length > 0 ? (
                        <Text className="text-[9px] text-muted-foreground">
                          {dayShifts.length}
                        </Text>
                      ) : null}
                    </View>
                    {dayShifts.length > 0 ? (
                      <View className="mt-1 flex-row flex-wrap gap-0.5">
                        {dayShifts.slice(0, MAX_INITIALS_PER_DAY).map((shift) => (
                          <View
                            key={shift.id}
                            style={{
                              backgroundColor: avatarColor(
                                shift.member?.firstName ?? '',
                                shift.member?.lastName ?? '',
                              ),
                            }}
                            className="h-4 w-4 items-center justify-center rounded-full"
                          >
                            <Text className="text-[7px] font-bold text-white">
                              {initials(
                                shift.member?.firstName ?? '',
                                shift.member?.lastName ?? '',
                              )}
                            </Text>
                          </View>
                        ))}
                        {dayShifts.length > MAX_INITIALS_PER_DAY ? (
                          <View className="h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1">
                            <Text className="text-[7px] font-semibold text-muted-foreground">
                              +{dayShifts.length - MAX_INITIALS_PER_DAY}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
          <EmptyState
            icon={Sparkles}
            title="Tap a day to assign"
            description="We'll suggest the member who's least busy — tap Assign to open today."
          />
        </View>
      )}

      <Modal visible={modalOpen} onClose={closeAssignModal} title="Assign a shift">
        <View className="gap-4">
          {draftDate ? (
            <Text className="text-sm font-medium text-foreground">
              {formatDate(fromDateOnly(draftDate), { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          ) : null}

          <View className="gap-1">
            <Text className="text-sm font-medium text-foreground">Service slot</Text>
            {sortedSlots.length === 0 ? (
              <Text className="text-sm text-muted-foreground">No slots configured yet.</Text>
            ) : (
              sortedSlots.map((slot) => (
                <SheetItem
                  key={slot.id}
                  label={slot.label}
                  subtitle={`${dayNameShort(slot.dayOfWeek)} · ${slot.startTime} – ${slot.endTime}`}
                  selected={slotId === slot.id}
                  onPress={() => {
                    setSlotId(slot.id);
                    setMemberIds([]);
                  }}
                />
              ))
            )}
          </View>

          {slotId ? (
            <View className="gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">Members</Text>
                <Text className="text-xs text-muted-foreground">
                  {memberIds.length > 0 ? `${memberIds.length} selected` : 'Select one or more'}
                </Text>
              </View>
              {suggestion ? (
                <>
                  {suggestion.suggestedMember.id ? (
                    <SheetItem
                      label={`${suggestion.suggestedMember.name} — suggested`}
                      subtitle={`${suggestion.suggestedMember.score} in 30 days · ${suggestion.suggestedMember.totalShifts} total`}
                      selected={memberIds.includes(suggestion.suggestedMember.id)}
                      onPress={() => toggleMember(suggestion.suggestedMember.id)}
                    />
                  ) : null}
                  {sortedCandidates
                    .filter((c) => c.id !== suggestedId)
                    .map((c) => (
                      <SheetItem
                        key={c.id}
                        label={c.name}
                        subtitle={`${c.score} in 30 days · ${c.totalShifts} total`}
                        selected={memberIds.includes(c.id)}
                        onPress={() => toggleMember(c.id)}
                      />
                    ))}
                </>
              ) : (members ?? []).some((m) => m.isActive !== false) ? (
                <>
                  <Text className="text-xs text-muted-foreground">
                    Refining best fit…
                  </Text>
                  {(members ?? [])
                    .filter((m) => m.isActive !== false)
                    .map((m) => (
                      <SheetItem
                        key={m.id}
                        label={`${m.firstName} ${m.lastName}`}
                        subtitle={m.email ?? 'Available member'}
                        selected={memberIds.includes(m.id)}
                        onPress={() => toggleMember(m.id)}
                      />
                    ))}
                </>
              ) : (
                <Spinner />
              )}
            </View>
          ) : null}

          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

          <Button
            onPress={onSubmit}
            disabled={!slotId || memberIds.length === 0}
            loading={createShifts.isPending}
          >
            {memberIds.length === 0
              ? 'Assign shift'
              : memberIds.length === 1
                ? 'Assign 1 shift'
                : `Assign ${memberIds.length} shifts`}
          </Button>
        </View>
      </Modal>

      <Modal
        visible={detailDate !== null}
        onClose={() => setDetailDate(null)}
        title={detailDate ? formatLongDate(detailDate) : 'Day details'}
      >
        <View className="gap-4">
          {detailShifts.length === 0 ? (
            <View className="items-center justify-center gap-2 rounded-md bg-muted px-4 py-6">
              <CalendarDays size={20} className="text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">No one scheduled this day yet.</Text>
            </View>
          ) : (
            <View className="gap-2">
              {detailShifts.map((shift) => (
                <View
                  key={shift.id}
                  className="flex-row items-center gap-3 rounded-md bg-muted px-3 py-3"
                >
                  {shift.member ? (
                    <Avatar
                      firstName={shift.member.firstName}
                      lastName={shift.member.lastName}
                      size="sm"
                    />
                  ) : null}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      {shift.member?.firstName} {shift.member?.lastName}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {shift.slot?.label ?? 'Service'}
                      {shift.slot ? ` · ${shift.slot.startTime} – ${shift.slot.endTime}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      confirmDeleteShift(shift.id, shiftMemberName(shift))
                    }
                    hitSlop={8}
                    className="rounded-full p-1 active:bg-destructive/10"
                    accessibilityLabel="Remove assignment"
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Button onPress={openAssignFromDetail}>
            <Plus size={16} className="text-primary-foreground" />
            Add a person
          </Button>
        </View>
      </Modal>

      <Modal
        visible={detailShift !== null}
        onClose={() => setDetailShift(null)}
        title="Assignment"
      >
        <View className="gap-4">
          {detailShift ? (
            <>
              <Text className="text-sm font-medium text-foreground">
                {formatLongDate(detailShift.date)}
              </Text>
              <View className="flex-row items-center gap-3 rounded-md bg-muted px-3 py-3">
                {detailShift.member ? (
                  <Avatar
                    firstName={detailShift.member.firstName}
                    lastName={detailShift.member.lastName}
                    size="sm"
                  />
                ) : null}
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    {detailShift.member?.firstName} {detailShift.member?.lastName}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {detailShift.slot?.label ?? 'Service'}
                    {detailShift.slot
                      ? ` · ${detailShift.slot.startTime} – ${detailShift.slot.endTime}`
                      : ''}
                  </Text>
                </View>
              </View>
              <Button
                variant="destructive"
                onPress={() =>
                  confirmDeleteShift(detailShift.id, shiftMemberName(detailShift), () =>
                    setDetailShift(null),
                  )
                }
                loading={deleteShift.isPending}
              >
                <Trash2 size={16} className="text-destructive-foreground" />
                Delete assignment
              </Button>
            </>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}
