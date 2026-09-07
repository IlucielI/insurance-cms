import {
  NotificationListResult,
  NotificationQueryFilter,
  CreateNotificationInput,
  NotificationItem,
} from '../repositories/notification.repository.interface';

export interface INotificationService {
  getNotifications(filter?: NotificationQueryFilter): Promise<NotificationListResult>;
  getUnreadCount(): Promise<number>;
  markAsRead(id: string): Promise<{ id: string; isRead: boolean; readAt: string }>;
  markAllAsRead(): Promise<{ updatedCount: number; unreadCount: number }>;
  createNotification(data: CreateNotificationInput): Promise<NotificationItem>;
}
