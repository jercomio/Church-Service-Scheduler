export interface AuthUser {
  id: string;
  email: string;
}

export interface SignInResult {
  userId: string;
  email: string;
  accessToken: string;
}

export interface AuthProvider {
  /** Verify a bearer token and return the authenticated user. */
  verifyToken(token: string): Promise<AuthUser>;
  /** Email + password sign in. */
  signInWithPassword(email: string, password: string): Promise<SignInResult>;
  /** Create a new identity (Supabase Auth user / local dev user). */
  signUp(email: string, password: string): Promise<SignInResult>;
  /** Send a magic link email. */
  sendMagicLink(email: string): Promise<void>;
  /** Request a password reset email. */
  sendPasswordReset(email: string): Promise<void>;
}
