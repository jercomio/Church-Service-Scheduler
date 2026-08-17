import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Modal, SheetItem } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateSlot } from '@/hooks/mutations';
import { useSlots } from '@/hooks/queries';
import { dayName, dayNameShort } from '@/lib/date';
import { ApiError } from '@/lib/api';
import { TIME_PATTERN, WEEK_DAYS } from '@css/shared';

export default function SlotsScreen() {
  const router = useRouter();
  const { data, isLoading } = useSlots();
  const createSlot = useCreateSlot();

  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<number, NonNullable<typeof data>>();
    for (const slot of data ?? []) {
      const list = map.get(slot.dayOfWeek) ?? [];
      list.push(slot);
      map.set(slot.dayOfWeek, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [data]);

  async function onCreate() {
    setError(null);
    if (!label.trim()) {
      setError('A label is required.');
      return;
    }
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      setError('Times must match HH:mm format.');
      return;
    }
    if (startTime >= endTime) {
      setError('Start time must be before end time.');
      return;
    }
    setCreating(true);
    try {
      await createSlot.mutateAsync({ label: label.trim(), dayOfWeek, startTime, endTime });
      setModalOpen(false);
      setLabel('');
      setStartTime('09:00');
      setEndTime('12:00');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create the slot.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Screen className="pt-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={8} className="rounded-full p-1 active:bg-muted" accessibilityLabel="Back">
            <ArrowLeft size={22} className="text-foreground" />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground">Service slots</Text>
        </View>
        <Button size="sm" onPress={() => setModalOpen(true)}>
          <Plus size={16} className="text-primary-foreground" />
          New
        </Button>
      </View>

      {isLoading ? (
        <Spinner />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No service slots"
          description="Create a recurring service time to start planning."
        />
      ) : (
        <View className="mt-4 gap-4">
          {groups.map(([day, slots]) => (
            <View key={day} className="gap-2">
              <Text className="text-sm font-semibold text-foreground">{dayName(day)}</Text>
              {slots.map((slot) => (
                <Card key={slot.id}>
                  <CardContent className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-medium text-foreground">{slot.label}</Text>
                      <Text className="text-sm text-muted-foreground">
                        {dayNameShort(slot.dayOfWeek)} · {slot.startTime} – {slot.endTime}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Badge variant={slot.isActive ? 'success' : 'muted'}>
                        {slot.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          ))}
        </View>
      )}

      <Modal visible={modalOpen} onClose={() => setModalOpen(false)} title="New service slot">
        <View className="gap-4">
          <FormField
            label="Label"
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Sunday Morning Worship"
          />
          <View className="gap-1">
            <Text className="text-sm font-medium text-foreground">Day of week</Text>
            {WEEK_DAYS.map((day) => (
              <SheetItem
                key={day}
                label={dayName(day)}
                selected={dayOfWeek === day}
                onPress={() => setDayOfWeek(day)}
              />
            ))}
          </View>
          <View className="flex-row gap-3">
            <FormField
              containerClassName="flex-1"
              label="Start (HH:mm)"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
              autoCapitalize="none"
            />
            <FormField
              containerClassName="flex-1"
              label="End (HH:mm)"
              value={endTime}
              onChangeText={setEndTime}
              placeholder="12:00"
              autoCapitalize="none"
            />
          </View>
          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
          <Button onPress={onCreate} loading={creating}>
            Create slot
          </Button>
        </View>
      </Modal>
    </Screen>
  );
}
