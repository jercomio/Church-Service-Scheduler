import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { MailCheck } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Screen } from '@/components/ui/Screen';
import { api, ApiError } from '@/lib/api';

export default function MagicLinkScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/magic-link', { email: email.trim() });
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send the link. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen keyboardShouldPersistTaps="handled">
        <View className="mt-12 gap-1">
          <Text className="text-3xl font-bold text-foreground">Magic link</Text>
          <Text className="text-base text-muted-foreground">
            We&apos;ll email you a secure sign-in link.
          </Text>
        </View>

        {sent ? (
          <View className="mt-10 items-center gap-4">
            <View className="rounded-full bg-success/10 p-4">
              <MailCheck size={32} className="text-success" />
            </View>
            <Text className="text-center text-base text-foreground">
              Check your inbox. Open the link we sent to {email.trim()} to sign in.
            </Text>
            <Button variant="outline" onPress={() => setSent(false)}>
              Send another
            </Button>
          </View>
        ) : (
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
            {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
            <Button onPress={onSubmit} disabled={!email} loading={loading}>
              Send magic link
            </Button>
          </View>
        )}

        <Text className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary">
            Back to sign in
          </Link>
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}
