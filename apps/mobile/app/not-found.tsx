import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Compass } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen className="items-center justify-center gap-4">
      <Compass size={40} className="text-muted-foreground" />
      <Text className="text-xl font-bold text-foreground">Page not found</Text>
      <Text className="text-center text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or isn&apos;t available to you.
      </Text>
      <Button onPress={() => router.replace('/')}>Go home</Button>
    </Screen>
  );
}
