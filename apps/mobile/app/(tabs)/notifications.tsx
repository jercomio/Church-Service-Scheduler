import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { BellOff, Check, CheckCheck, ListChecks, Trash2 } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Spinner } from '@/components/ui/Spinner';
import { SwipeableRow } from '@/components/SwipeableRow';
import {
  useDeleteNotification,
  useDeleteNotifications,
  useReadAllNotifications,
  useReadNotification,
} from '@/hooks/mutations';
import { useNotifications } from '@/hooks/queries';
import { cn } from '@/lib/utils';

export default function NotificationsScreen() {
  const { data, isLoading } = useNotifications();
  const queryClient = useQueryClient();
  const readAll = useReadAllNotifications();
  const readOne = useReadNotification();
  const deleteOne = useDeleteNotification();
  const deleteMany = useDeleteNotifications();

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({ queryKey: ['notifications'] });
    }, [queryClient]),
  );

  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const notifications = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data],
  );
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  function exitSelection() {
    setSelecting(false);
    setSelectedIds([]);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function confirmDeleteOne(id: string) {
    Alert.alert('Delete notification', 'Delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void deleteOne.mutate(id),
      },
    ]);
  }

  function confirmDeleteSelected() {
    Alert.alert(
      'Delete notifications',
      `Delete ${selectedIds.length} ${selectedIds.length === 1 ? 'notification' : 'notifications'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMany.mutateAsync(selectedIds);
            exitSelection();
          },
        },
      ],
    );
  }

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Screen scroll className="pt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">Alerts</Text>
        {selecting ? (
          <View className="flex-row items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedIds.length === 0}
              loading={deleteMany.isPending}
              onPress={confirmDeleteSelected}
            >
              <Trash2 size={16} className="text-destructive-foreground" />
              Delete {selectedIds.length > 0 ? selectedIds.length : ''}
            </Button>
            <Button variant="outline" size="sm" onPress={exitSelection}>
              <Text className="text-sm text-foreground">Done</Text>
            </Button>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            {unreadCount > 0 ? (
              <Button variant="outline" size="sm" onPress={() => readAll.mutate()}>
                <CheckCheck size={16} className="text-foreground" />
                Mark all read
              </Button>
            ) : null}
            <Pressable
              onPress={() => setSelecting(true)}
              hitSlop={8}
              className="rounded-full p-1 active:bg-muted"
              accessibilityLabel="Select multiple notifications"
            >
              <ListChecks size={20} className="text-foreground" />
            </Pressable>
          </View>
        )}
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          description="You'll be alerted here when your schedule changes."
        />
      ) : (
        <View className="mt-4 gap-3">
          {notifications.map((notification) => {
            const unread = !notification.readAt;
            const isSelected = selectedIds.includes(notification.id);

            if (selecting) {
              return (
                <Pressable
                  key={notification.id}
                  onPress={() => toggleSelect(notification.id)}
                  className={cn(
                    'rounded-md border border-border bg-card p-4 active:opacity-80',
                    isSelected && 'border-primary bg-accent',
                  )}
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1 gap-1">
                      <Text className="text-base font-semibold text-foreground">
                        {notification.title}
                      </Text>
                      <Text className="text-sm text-muted-foreground">{notification.body}</Text>
                      <Text className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View
                      className={cn(
                        'h-6 w-6 items-center justify-center rounded-full border border-border',
                        isSelected && 'border-primary bg-primary',
                      )}
                    >
                      {isSelected ? (
                        <Check size={14} className="text-primary-foreground" />
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            }

            return (
              <SwipeableRow
                key={notification.id}
                onPress={() => undefined}
                onDelete={() => confirmDeleteOne(notification.id)}
                accessibilityLabel="Delete notification"
              >
                <Card className={cn(unread && 'border-primary/40 bg-primary/5')}>
                  <CardContent className="gap-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="flex-1 text-base font-semibold text-foreground">
                        {notification.title}
                      </Text>
                      {unread ? <Badge variant="default">New</Badge> : null}
                    </View>
                    <Text className="text-sm text-muted-foreground">{notification.body}</Text>
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      {unread ? (
                        <Pressable onPress={() => readOne.mutate(notification.id)} hitSlop={8}>
                          <CheckCheck size={16} className="text-muted-foreground" />
                        </Pressable>
                      ) : null}
                    </View>
                  </CardContent>
                </Card>
              </SwipeableRow>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
