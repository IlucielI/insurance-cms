export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export type NotificationCategory = 'underwriting' | 'system' | 'knowledge' | 'policy';

export interface NotificationItem {
  id: string;
  type: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationListResult {
  data: NotificationItem[];
  total: number;
  unreadCount: number;
}

export interface NotificationQueryFilter {
  category?: string;
  severity?: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateNotificationInput {
  type: string;
  category: string;
  severity?: string;
  title: string;
  message: string;
  link?: string;
}

export interface INotificationRepository {
  getNotifications(filter?: NotificationQueryFilter): Promise<NotificationListResult>;
  getUnreadCount(): Promise<number>;
  markAsRead(id: string): Promise<{ id: string; isRead: boolean; readAt: string }>;
  markAllAsRead(): Promise<{ updatedCount: number; unreadCount: number }>;
  createNotification(data: CreateNotificationInput): Promise<NotificationItem>;
}
