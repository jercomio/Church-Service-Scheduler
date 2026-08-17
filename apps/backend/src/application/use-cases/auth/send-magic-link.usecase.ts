import { MagicLinkInput } from '@css/shared';
import { AuthProvider } from '../../ports/auth-provider';

export class SendMagicLinkUseCase {
  constructor(private readonly authProvider: AuthProvider) {}

  async execute(input: MagicLinkInput): Promise<{ ok: true }> {
    await this.authProvider.sendMagicLink(input.email);
    return { ok: true };
  }
}
