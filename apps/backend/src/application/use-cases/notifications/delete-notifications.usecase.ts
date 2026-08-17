import { DeleteNotificationsInput } from '@css/shared';
import { NotificationRepository } from '../../../domain/repositories/notification-repository';
import { AuthContext } from '../../auth-context';

export class DeleteNotificationsUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(ctx: AuthContext, input: DeleteNotificationsInput): Promise<{ ok: true }> {
    await this.notifications.deleteMany(ctx.userId, input.ids);
    return { ok: true };
  }
}
