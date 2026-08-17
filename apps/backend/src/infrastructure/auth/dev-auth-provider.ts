import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { AuthProvider, AuthUser, SignInResult } from '../../application/ports/auth-provider';
import { UserRepository } from '../../domain/repositories/user-repository';

/**
 * Local development auth provider — no external service required.
 * - Issues signed JWTs (same shape Supabase would).
 * - Stores a bcrypt password hash on the local User row.
 * Switch `AUTH_PROVIDER=supabase` for production.
 */
export class DevAuthProvider implements AuthProvider {
  constructor(
    private readonly users: UserRepository,
    private readonly jwtSecret: string,
  ) {}

  async verifyToken(token: string): Promise<AuthUser> {
    const payload = jwt.verify(token, this.jwtSecret, { algorithms: ['HS256'] }) as {
      sub?: string;
      email?: string;
    };
    if (!payload.sub) throw new Error('Token has no subject');
    return { id: payload.sub, email: payload.email ?? '' };
  }

  async signInWithPassword(email: string, password: string): Promise<SignInResult & { accessToken: string }> {
    const user = await this.users.findCredentialsByEmail(email.toLowerCase());
    if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }
    return {
      userId: user.id,
      email: user.email,
      accessToken: this.issueToken(user.id, user.email),
    };
  }

  async signUp(email: string, password: string): Promise<SignInResult & { accessToken: string }> {
    const normalized = email.toLowerCase();
    const id = randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    await this.users.create({
      id,
      email: normalized,
      role: 'COORDINATOR',
      passwordHash,
    });
    return { userId: id, email: normalized, accessToken: this.issueToken(id, normalized) };
  }

  async sendMagicLink(email: string): Promise<void> {
    const user = await this.users.findByEmail(email.toLowerCase());
    if (!user) throw new Error('No account for this email');
  }

  async sendPasswordReset(email: string): Promise<void> {
    const user = await this.users.findByEmail(email.toLowerCase());
    if (!user) throw new Error('No account for this email');
  }

  private issueToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, this.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });
  }
}
