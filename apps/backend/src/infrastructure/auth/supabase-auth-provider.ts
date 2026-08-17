import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AuthProvider, AuthUser, SignInResult } from '../../application/ports/auth-provider';

export class SupabaseAuthProvider implements AuthProvider {
  private readonly client: SupabaseClient;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;

  constructor(
    url: string,
    serviceRoleKey: string,
    private readonly jwtSecret: string,
    jwksUrl: string,
  ) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Supabase projects created after mid-2024 sign tokens with RS256 (JWKS)
    // and no longer expose a shared JWT secret. Fall back to HS256 for legacy projects.
    this.jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;
  }

  async verifyToken(token: string): Promise<AuthUser> {
    let sub: string | undefined;
    let email: string | undefined;

    if (this.jwks) {
      const { payload } = await jwtVerify(token, this.jwks);
      sub = payload.sub;
      email = typeof payload.email === 'string' ? payload.email : undefined;
    } else {
      const payload = jwt.verify(token, this.jwtSecret, { algorithms: ['HS256'] }) as {
        sub?: string;
        email?: string;
      };
      sub = payload.sub;
      email = payload.email;
    }

    if (!sub) throw new Error('Token has no subject');
    return { id: sub, email: email ?? '' };
  }

  async signInWithPassword(email: string, password: string): Promise<SignInResult & { accessToken: string }> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error(error?.message ?? 'Sign in failed');
    return {
      userId: data.user.id,
      email: data.user.email ?? email,
      accessToken: data.session?.access_token ?? '',
    };
  }

  async signUp(email: string, password: string): Promise<SignInResult & { accessToken: string }> {
    // Use the admin API to bypass GoTrue's extended email validation that runs
    // when a confirmation email is sent, and to auto-confirm the user. The user
    // is then signed in directly to get a session token.
    const { data, error } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(error?.message ?? 'Sign up failed');

    const { data: session, error: signInError } =
      await this.client.auth.signInWithPassword({ email, password });
    if (signInError || !session.session) {
      throw new Error(signInError?.message ?? 'Sign in after sign up failed');
    }
    return {
      userId: data.user.id,
      email: data.user.email ?? email,
      accessToken: session.session.access_token,
    };
  }

  async sendMagicLink(email: string): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({ email });
    if (error) throw new Error(error.message);
  }

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }
}
