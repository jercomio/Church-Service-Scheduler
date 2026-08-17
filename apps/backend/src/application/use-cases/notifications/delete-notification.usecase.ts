import { ApiError } from '@css/shared';
import { NotificationRepository } from '../../../domain/repositories/notification-repository';
import { AuthContext } from '../../auth-context';

export class DeleteNotificationUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(ctx: AuthContext, id: string): Promise<{ ok: true }> {
    const notification = await this.notifications.findById(id);
    if (!notification) throw new ApiError('NOT_FOUND', 404, 'Notification not found');
    if (notification.userId !== ctx.userId) {
      throw new ApiError('FORBIDDEN', 403, 'You cannot delete this notification');
    }
    await this.notifications.delete(id);
    return { ok: true };
  }
}
