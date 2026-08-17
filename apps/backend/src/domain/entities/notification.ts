export interface NotificationEntity {
  id: string;
  userId: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}
