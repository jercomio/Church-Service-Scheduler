import { NotificationEntity } from '../entities/notification';

export interface NotificationRepository {
  findById(id: string): Promise<NotificationEntity | null>;
  listForUser(userId: string): Promise<NotificationEntity[]>;
  countUnread(userId: string): Promise<number>;
  create(data: { userId: string; title: string; body: string }): Promise<NotificationEntity>;
  markAsRead(id: string): Promise<NotificationEntity | null>;
  markAllAsRead(userId: string): Promise<number>;
  delete(id: string): Promise<NotificationEntity | null>;
  deleteMany(userId: string, ids: string[]): Promise<number>;
}
