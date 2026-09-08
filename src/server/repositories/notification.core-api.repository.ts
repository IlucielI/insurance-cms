import {
  INotificationRepository,
  NotificationItem,
  NotificationListResult,
  NotificationQueryFilter,
  CreateNotificationInput,
  NotificationCategory,
  NotificationSeverity,
} from './notification.repository.interface';
import { NotificationMockRepository } from './notification.mock.repository';

interface CoreApiNotificationItem {
  id: string;
  type: string;
  category: string;
  severity: string;
  title: string;
  message: string;
  link?: string;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
  read_at?: string | null;
  readAt?: string | null;
}

interface CoreApiNotificationsListResponse {
  data: CoreApiNotificationItem[];
  total: number;
  unread_count?: number;
  unreadCount?: number;
}

interface CoreApiSingleNotificationResponse {
  data: CoreApiNotificationItem;
}

interface CoreApiMarkReadResponse {
  data: {
    id: string;
    is_read?: boolean;
    isRead?: boolean;
    read_at?: string;
    readAt?: string;
  };
}

interface CoreApiMarkAllReadResponse {
  data: {
    updated_count?: number;
    updatedCount?: number;
    unread_count?: number;
    unreadCount?: number;
  };
}

interface CoreApiUnreadCountResponse {
  unread_count?: number;
  unreadCount?: number;
}

export class CoreApiNotificationRepository implements INotificationRepository {
  private readonly baseUrl: string;
  private readonly mockFallback: NotificationMockRepository;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl !== undefined ? baseUrl : this.resolveBaseUrl();
    this.mockFallback = new NotificationMockRepository();
  }

  private resolveBaseUrl(): string {
    return process.env.CORE_API_URL?.trim() || '';
  }

  private mapNotificationItem(item: CoreApiNotificationItem): NotificationItem {
    return {
      id: item.id,
      type: item.type,
      category: (item.category?.toLowerCase() as NotificationCategory) || 'underwriting',
      severity: (item.severity?.toUpperCase() as NotificationSeverity) || 'INFO',
      title: item.title,
      message: item.message,
      link: item.link || '',
      isRead: item.is_read ?? item.isRead ?? false,
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      readAt: item.read_at ?? item.readAt ?? null,
    };
  }

  private async fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        let errorMsg = `Core API request failed: ${response.status} ${response.statusText}`;
        try {
          const errBody = await response.json();
          if (errBody?.error) {
            errorMsg = errBody.error;
          }
        } catch {
          // Keep fallback message
        }

        const err = new Error(errorMsg) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getNotifications(filter?: NotificationQueryFilter): Promise<NotificationListResult> {
    if (!this.baseUrl) {
      return this.mockFallback.getNotifications(filter);
    }

    try {
      const params = new URLSearchParams();
      if (filter?.category && filter.category !== 'all') {
        params.append('category', filter.category);
      }
      if (filter?.severity && filter.severity !== 'all' && filter.severity !== 'ALL') {
        params.append('severity', filter.severity);
      }
      if (filter?.unreadOnly !== undefined) {
        params.append('unread_only', String(filter.unreadOnly));
      }
      if (filter?.limit && filter.limit > 0) {
        params.append('limit', String(filter.limit));
      }
      if (filter?.offset !== undefined && filter.offset >= 0) {
        params.append('offset', String(filter.offset));
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await this.fetchApi<CoreApiNotificationsListResponse>(
        `/api/v1/admin/notifications${queryString}`
      );

      const rawItems = res?.data || [];
      const data = rawItems.map((item) => this.mapNotificationItem(item));
      const total = res?.total ?? data.length;
      const unreadCount = res?.unread_count ?? res?.unreadCount ?? data.filter((n) => !n.isRead).length;

      return {
        data,
        total,
        unreadCount,
      };
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.getNotifications(filter);
    }
  }

  async getUnreadCount(): Promise<number> {
    if (!this.baseUrl) {
      return this.mockFallback.getUnreadCount();
    }

    try {
      const res = await this.fetchApi<CoreApiUnreadCountResponse>(
        '/api/v1/admin/notifications/unread-count'
      );
      return res.unread_count ?? res.unreadCount ?? 0;
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.getUnreadCount();
    }
  }

  async markAsRead(id: string): Promise<{ id: string; isRead: boolean; readAt: string }> {
    if (!id || !id.trim()) {
      throw new Error('id is required');
    }

    if (!this.baseUrl) {
      return this.mockFallback.markAsRead(id);
    }

    try {
      const res = await this.fetchApi<CoreApiMarkReadResponse>(
        `/api/v1/admin/notifications/${encodeURIComponent(id.trim())}/read`,
        { method: 'PATCH' }
      );

      const d = res?.data || {};
      return {
        id: d.id || id,
        isRead: d.is_read ?? d.isRead ?? true,
        readAt: d.read_at || d.readAt || new Date().toISOString(),
      };
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.markAsRead(id);
    }
  }

  async markAllAsRead(): Promise<{ updatedCount: number; unreadCount: number }> {
    if (!this.baseUrl) {
      return this.mockFallback.markAllAsRead();
    }

    try {
      const res = await this.fetchApi<CoreApiMarkAllReadResponse>(
        '/api/v1/admin/notifications/mark-all-read',
        { method: 'POST' }
      );

      const d = res?.data || {};
      return {
        updatedCount: d.updated_count ?? d.updatedCount ?? 0,
        unreadCount: d.unread_count ?? d.unreadCount ?? 0,
      };
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.markAllAsRead();
    }
  }

  async createNotification(data: CreateNotificationInput): Promise<NotificationItem> {
    if (!this.baseUrl) {
      return this.mockFallback.createNotification(data);
    }

    try {
      const res = await this.fetchApi<CoreApiSingleNotificationResponse>(
        '/api/v1/admin/notifications',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );

      return this.mapNotificationItem(res.data);
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.createNotification(data);
    }
  }
}
