import { NotificationRepository } from '../../../domain/repositories/notification-repository';
import { AuthContext } from '../../auth-context';

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(ctx: AuthContext): Promise<{ updated: number }> {
    const updated = await this.notifications.markAllAsRead(ctx.userId);
    return { updated };
  }
}
