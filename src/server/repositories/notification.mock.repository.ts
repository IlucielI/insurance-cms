import {
  INotificationRepository,
  NotificationItem,
  NotificationListResult,
  NotificationQueryFilter,
  CreateNotificationInput,
  NotificationCategory,
  NotificationSeverity,
} from './notification.repository.interface';

export class NotificationMockRepository implements INotificationRepository {
  private notifications: NotificationItem[] = [
    {
      id: 'notif_seed_001',
      type: 'APPLICATION_SUBMITTED',
      category: 'underwriting',
      severity: 'INFO',
      title: 'Aplikasi Baru: Budi Santoso (#APP-2026-8819)',
      message: 'Pengajuan polis Secure Life Plus baru masuk dan menunggu review underwriting.',
      link: '/queue',
      isRead: false,
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      readAt: null,
    },
    {
      id: 'notif_seed_002',
      type: 'SLA_WARNING',
      category: 'underwriting',
      severity: 'WARNING',
      title: 'SLA Warning: Aplikasi #APP-2026-8812',
      message: 'Aplikasi telah berada dalam status UNDERWRITING_REVIEW selama lebih dari 20 jam.',
      link: '/queue',
      isRead: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      readAt: null,
    },
    {
      id: 'notif_seed_003',
      type: 'KNOWLEDGE_SYNCED',
      category: 'knowledge',
      severity: 'SUCCESS',
      title: 'Sinkronisasi Knowledge Base Berhasil',
      message: 'Dokumen SOP Underwriting Terpadu 2026 berhasil divektorisasi ke knowledge base.',
      link: '/knowledge',
      isRead: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      readAt: null,
    },
    {
      id: 'notif_seed_004',
      type: 'SYSTEM_ALERT',
      category: 'system',
      severity: 'INFO',
      title: 'Audit Log Tamper Check Passed',
      message: 'Verifikasi berkala SHA-256 tamper-proof audit trail selesai dengan integritas 100%.',
      link: '/health',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_seed_005',
      type: 'APPLICATION_APPROVED',
      category: 'underwriting',
      severity: 'SUCCESS',
      title: 'Polis Diterbitkan: POL-2026-SLP-08819',
      message: 'Aplikasi #APP-2026-8819 telah disetujui dan polis resmi diterbitkan.',
      link: '/queue',
      isRead: true,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 48 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    },
  ];

  async getNotifications(filter?: NotificationQueryFilter): Promise<NotificationListResult> {
    let filtered = [...this.notifications];

    if (filter?.category && filter.category !== 'all') {
      filtered = filtered.filter((n) => n.category === filter.category);
    }

    if (filter?.severity && filter.severity !== 'all' && filter.severity !== 'ALL') {
      filtered = filtered.filter((n) => n.severity.toUpperCase() === filter.severity?.toUpperCase());
    }

    if (filter?.unreadOnly) {
      filtered = filtered.filter((n) => !n.isRead);
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const unreadCount = this.notifications.filter((n) => !n.isRead).length;

    const offset = Math.max(0, filter?.offset ?? 0);
    const limit = filter?.limit && filter.limit > 0 ? filter.limit : 20;

    const paginated = filtered.slice(offset, offset + limit);

    return {
      data: paginated,
      total,
      unreadCount,
    };
  }

  async getUnreadCount(): Promise<number> {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  async markAsRead(id: string): Promise<{ id: string; isRead: boolean; readAt: string }> {
    const item = this.notifications.find((n) => n.id === id);
    if (!item) {
      throw new Error(`Notification with id ${id} not found`);
    }

    const readAt = new Date().toISOString();
    item.isRead = true;
    item.readAt = readAt;

    return {
      id: item.id,
      isRead: true,
      readAt,
    };
  }

  async markAllAsRead(): Promise<{ updatedCount: number; unreadCount: number }> {
    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const item of this.notifications) {
      if (!item.isRead) {
        item.isRead = true;
        item.readAt = now;
        updatedCount++;
      }
    }

    return {
      updatedCount,
      unreadCount: 0,
    };
  }

  async createNotification(data: CreateNotificationInput): Promise<NotificationItem> {
    const now = new Date().toISOString();
    const id = `notif_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newItem: NotificationItem = {
      id,
      type: data.type,
      category: (data.category.toLowerCase() as NotificationCategory) || 'underwriting',
      severity: (data.severity?.toUpperCase() as NotificationSeverity) || 'INFO',
      title: data.title,
      message: data.message,
      link: data.link || '',
      isRead: false,
      createdAt: now,
      readAt: null,
    };

    this.notifications.unshift(newItem);
    return newItem;
  }
}
