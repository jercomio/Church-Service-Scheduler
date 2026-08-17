import { ApiError, AuthResponseDto, LoginInput } from '@css/shared';
import { AuthProvider } from '../../ports/auth-provider';
import { UserRepository } from '../../../domain/repositories/user-repository';

export class LoginUseCase {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly users: UserRepository,
  ) {}

  async execute(input: LoginInput): Promise<AuthResponseDto> {
    let signIn;
    try {
      signIn = await this.authProvider.signInWithPassword(input.email, input.password);
    } catch {
      throw new ApiError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    // First login of a Supabase user: backfill the local User row.
    let user = await this.users.findByEmail(signIn.email);
    if (!user) {
      user = await this.users.create({ id: signIn.userId, email: signIn.email, role: 'MEMBER' });
    }

    return { token: signIn.accessToken, user: { id: user.id, email: user.email, role: user.role } };
  }
}
