import { Tabs } from 'expo-router';
import { Bell, CalendarDays, Home, Settings, Users } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useUnreadCount } from '@/hooks/queries';
import { useThemeColors } from '@/lib/theme-colors';

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadCount();
  const colors = useThemeColors();

  const isManager = user?.role === 'COORDINATOR' || user?.role === 'ADMIN';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.input,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          href: isManager ? undefined : null,
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          href: isManager ? undefined : null,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color as string} />,
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.destructive },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
