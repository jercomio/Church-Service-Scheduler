import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { Church, Eye, EyeOff } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Screen } from '@/components/ui/Screen';
import { ApiError } from '@/lib/api';
import { useThemeColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const colors = useThemeColors();
  const appName = Constants.expoConfig?.name ?? 'Church Service Scheduler';

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll keyboardShouldPersistTaps="handled">
        <View className="mt-12 items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Church size={32} color="hsl(210 20% 98%)" />
          </View>
          <Text className="text-lg font-semibold text-foreground">{appName}</Text>
        </View>

        <View className="mt-6 gap-1">
          <Text className="text-3xl font-bold text-foreground">Welcome back</Text>
          <Text className="text-base text-muted-foreground">
            Sign in to manage your service schedule.
          </Text>
        </View>

        <View className="mt-8 gap-4">
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@church.org"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            textContentType="password"
            rightElement={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.mutedForeground} />
                ) : (
                  <Eye size={20} color={colors.mutedForeground} />
                )}
              </Pressable>
            }
          />

          <View className="flex-row justify-end">
            <Link href="/reset-password" className="text-sm font-medium text-primary">
              Forgot password?
            </Link>
          </View>

          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

          <Button onPress={onSubmit} disabled={!email || !password} loading={loading}>
            Sign in
          </Button>
        </View>

        <View className="mt-8 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-border" />
          <Text className="text-sm text-muted-foreground">or</Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        <View className="mt-8 gap-3">
          <Button variant="outline" onPress={() => {}}>
            <Link href="/magic-link" className="w-full text-center font-medium text-foreground">
              Continue with magic link
            </Link>
          </Button>
          <Text className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary">
              Create one
            </Link>
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
