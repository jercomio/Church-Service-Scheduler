import { NotificationDto } from '@css/shared';
import { NotificationRepository } from '../../../domain/repositories/notification-repository';
import { AuthContext } from '../../auth-context';
import { toNotificationDto } from '../../mappers';

export class ListNotificationsUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(ctx: AuthContext): Promise<NotificationDto[]> {
    const notifications = await this.notifications.listForUser(ctx.userId);
    return notifications.map(toNotificationDto);
  }
}
