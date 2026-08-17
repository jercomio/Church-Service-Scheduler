import { Notification } from '@prisma/client';
import { NotificationEntity } from '../../../domain/entities/notification';
import { NotificationRepository } from '../../../domain/repositories/notification-repository';
import { prisma } from '../client';

function toEntity(row: Notification): NotificationEntity {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    body: row.body,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export class PrismaNotificationRepository implements NotificationRepository {
  async findById(id: string): Promise<NotificationEntity | null> {
    const row = await prisma.notification.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async listForUser(userId: string): Promise<NotificationEntity[]> {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toEntity);
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  async create(data: { userId: string; title: string; body: string }): Promise<NotificationEntity> {
    const row = await prisma.notification.create({ data });
    return toEntity(row);
  }

  async markAsRead(id: string): Promise<NotificationEntity | null> {
    try {
      const row = await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
      return toEntity(row);
    } catch {
      return null;
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  async delete(id: string): Promise<NotificationEntity | null> {
    try {
      const row = await prisma.notification.delete({ where: { id } });
      return toEntity(row);
    } catch {
      return null;
    }
  }

  async deleteMany(userId: string, ids: string[]): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return result.count;
  }
}
