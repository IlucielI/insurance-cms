import {
  INotificationRepository,
  NotificationListResult,
  NotificationQueryFilter,
  CreateNotificationInput,
  NotificationItem,
} from '../repositories/notification.repository.interface';
import { INotificationService } from './notification.service.interface';

export class NotificationService implements INotificationService {
  constructor(private readonly repository: INotificationRepository) {}

  async getNotifications(filter?: NotificationQueryFilter): Promise<NotificationListResult> {
    return this.repository.getNotifications(filter);
  }

  async getUnreadCount(): Promise<number> {
    return this.repository.getUnreadCount();
  }

  async markAsRead(id: string): Promise<{ id: string; isRead: boolean; readAt: string }> {
    if (!id || !id.trim()) {
      throw new Error('id is required');
    }
    return this.repository.markAsRead(id.trim());
  }

  async markAllAsRead(): Promise<{ updatedCount: number; unreadCount: number }> {
    return this.repository.markAllAsRead();
  }

  async createNotification(data: CreateNotificationInput): Promise<NotificationItem> {
    return this.repository.createNotification(data);
  }
}
