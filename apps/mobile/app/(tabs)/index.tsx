import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarClock, ChevronRight, Clock, Lock, Users } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Spinner } from '@/components/ui/Spinner';
import { useFeatureFlag, useProfile } from '@/hooks/queries';
import { useAuthStore } from '@/stores/auth.store';
import { formatLongDate, relativeLabel } from '@/lib/date';

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="flex-1">
      <CardContent className="gap-1">
        <View className="flex-row items-center gap-1.5 text-muted-foreground">
          {icon}
          <Text className="text-xs text-muted-foreground">{label}</Text>
        </View>
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
      </CardContent>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useProfile();
  const isManager = user?.role === 'COORDINATOR' || user?.role === 'ADMIN';
  const canSeeSlots = useFeatureFlag('advanced-settings') || isManager;

  const displayName = useMemo(() => {
    const userId = profile?.user.id ?? user?.id;
    const memberId = profile?.user.memberId ?? user?.memberId;
    const me = profile?.team?.members?.find(
      (m) => m.id === memberId || (userId !== undefined && m.userId === userId),
    );
    if (me?.firstName && me?.lastName) {
      return `${me.firstName} ${me.lastName}`;
    }
    const raw = profile?.user.email ?? user?.email ?? '';
    const local = raw.split('@')[0] ?? '';
    return local.charAt(0).toUpperCase() + local.slice(1);
  }, [profile, user]);

  if (isLoading) {
    return <Spinner label="Loading your dashboard…" />;
  }

  const nextShifts = profile?.nextShifts ?? [];

  return (
    <Screen scroll className="pt-4">
      <View className="gap-1">
        <Text className="text-3xl font-bold text-foreground">Hello, {displayName} !</Text>
        <View className="flex-row items-center gap-2">
          <Badge
            variant={
              user?.role === 'ADMIN'
                ? 'destructive'
                : user?.role === 'COORDINATOR'
                  ? 'outline'
                  : 'secondary'
            }
          >
            {user?.role === 'ADMIN'
              ? 'Admin'
              : user?.role === 'COORDINATOR'
                ? 'Coordinator'
                : 'Member'}
          </Badge>
          <Text className="text-base text-muted-foreground">
            {profile?.team
              ? isManager
                ? `${profile.team.name} · ${profile.team.members.length} members`
                : profile.team.name
              : 'Your service schedule'}
          </Text>
        </View>
      </View>

      <View className="mt-6 flex-row gap-3">
        <StatCard
          label="Total shifts"
          value={String(profile?.stats.totalShifts ?? 0)}
          icon={<Clock size={14} className="text-muted-foreground" />}
        />
        <StatCard
          label="Upcoming"
          value={String(profile?.stats.upcomingShifts ?? 0)}
          icon={<CalendarClock size={14} className="text-muted-foreground" />}
        />
      </View>

      <Text className="mt-6 mb-3 text-lg font-semibold text-foreground">Next services</Text>
      {nextShifts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={CalendarClock}
              title="No upcoming service"
              description="You have no shifts scheduled. The coordinator will assign you soon."
            />
          </CardContent>
        </Card>
      ) : (
        <View className="gap-3">
          {nextShifts.map((shift) => {
            const isSunday = new Date(`${shift.date}T00:00:00`).getDay() === 0;
            return (
              <Card key={shift.id} className={isSunday ? 'bg-muted/50' : undefined}>
                <CardContent className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-foreground">
                      {shift.slot?.label ?? 'Service'}
                    </Text>
                    <Badge variant="success">{relativeLabel(new Date(`${shift.date}T00:00:00`))}</Badge>
                  </View>
                  <Text className="text-sm text-muted-foreground">{formatLongDate(shift.date)}</Text>
                  {shift.slot ? (
                    <Text className="text-sm text-muted-foreground">
                      {shift.slot.startTime} – {shift.slot.endTime}
                    </Text>
                  ) : null}
                  {shift.member ? (
                    <Text className="text-sm font-medium text-foreground">
                      {shift.member.firstName} {shift.member.lastName}
                    </Text>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}

      {canSeeSlots ? (
        <Text className="mt-6 mb-3 text-lg font-semibold text-foreground">Manage</Text>
      ) : null}
      {canSeeSlots ? (
        <View className="gap-3">
          <Pressable
            onPress={() => router.push('/slots')}
            className="flex-row items-center justify-between rounded-lg border border-border bg-card p-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View className="rounded-full bg-primary/10 p-2">
                <Clock size={20} className="text-primary" />
              </View>
              <View>
                <Text className="text-base font-medium text-foreground">Service slots</Text>
                <Text className="text-sm text-muted-foreground">Manage weekly service times</Text>
              </View>
            </View>
            <ChevronRight size={18} className="text-muted-foreground" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/members')}
            className="flex-row items-center justify-between rounded-lg border border-border bg-card p-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View className="rounded-full bg-primary/10 p-2">
                <Users size={20} className="text-primary" />
              </View>
              <View>
                <Text className="text-base font-medium text-foreground">Members</Text>
                <Text className="text-sm text-muted-foreground">Manage your team roster</Text>
              </View>
            </View>
            <ChevronRight size={18} className="text-muted-foreground" />
          </Pressable>
        </View>
      ) : null}

      <Card className="mt-6">
        <CardContent className="flex-row items-center gap-3">
          <View className="rounded-full bg-muted p-2">
            <Lock size={18} className="text-muted-foreground" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground">Advanced settings</Text>
            <Text className="text-sm text-muted-foreground">
              Available on the Pro plan. Upgrade to unlock.
            </Text>
          </View>
          <Badge variant="outline">Pro</Badge>
        </CardContent>
      </Card>
    </Screen>
  );
}
