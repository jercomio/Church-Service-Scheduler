import { ApiError, NotificationDto } from '@css/shared';
import { NotificationRepository } from '../../../domain/repositories/notification-repository';
import { AuthContext } from '../../auth-context';
import { toNotificationDto } from '../../mappers';

export class MarkNotificationReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(ctx: AuthContext, id: string): Promise<NotificationDto> {
    const notification = await this.notifications.findById(id);
    if (!notification) throw new ApiError('NOT_FOUND', 404, 'Notification not found');
    if (notification.userId !== ctx.userId) {
      throw new ApiError('FORBIDDEN', 403, 'Notification does not belong to you');
    }
    const updated = await this.notifications.markAsRead(id);
    if (!updated) throw new ApiError('NOT_FOUND', 404, 'Notification not found');
    return toNotificationDto(updated);
  }
}
