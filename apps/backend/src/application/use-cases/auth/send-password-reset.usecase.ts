import { ResetPasswordInput } from '@css/shared';
import { AuthProvider } from '../../ports/auth-provider';

export class SendPasswordResetUseCase {
  constructor(private readonly authProvider: AuthProvider) {}

  async execute(input: ResetPasswordInput): Promise<{ ok: true }> {
    await this.authProvider.sendPasswordReset(input.email);
    return { ok: true };
  }
}
