import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Screen } from '@/components/ui/Screen';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function SignupScreen() {
  const signup = useAuthStore((s) => s.signup);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signup(firstName.trim(), lastName.trim(), email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Sign up failed. Please try again.');
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
        <View className="mt-12 gap-1">
          <Text className="text-3xl font-bold text-foreground">Create account</Text>
          <Text className="text-base text-muted-foreground">
            Join your team and get scheduled for services.
          </Text>
        </View>

        <View className="mt-8 gap-4">
          <View className="flex-row gap-3">
            <FormField
              containerClassName="flex-1"
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jane"
              autoComplete="given-name"
              textContentType="givenName"
            />
            <FormField
              containerClassName="flex-1"
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              autoComplete="family-name"
              textContentType="familyName"
            />
          </View>
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
            placeholder="At least 8 characters"
            secureTextEntry
            textContentType="newPassword"
          />
          <FormField
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat your password"
            secureTextEntry
            textContentType="newPassword"
          />

          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

          <Button
            onPress={onSubmit}
            disabled={!firstName || !lastName || !email || password.length < 8}
            loading={loading}
          >
            Create account
          </Button>
        </View>

        <Text className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary">
            Sign in
          </Link>
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}
