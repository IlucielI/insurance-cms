import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoreApiNotificationRepository } from './notification.core-api.repository';

describe('CoreApiNotificationRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to mock repository when baseUrl is empty', async () => {
    const repo = new CoreApiNotificationRepository('');
    const unread = await repo.getUnreadCount();
    expect(unread).toBe(3);

    const list = await repo.getNotifications();
    expect(list.total).toBe(5);
    expect(list.unreadCount).toBe(3);

    const marked = await repo.markAsRead('notif_seed_001');
    expect(marked.isRead).toBe(true);

    const markAll = await repo.markAllAsRead();
    expect(markAll.updatedCount).toBe(2);

    const created = await repo.createNotification({
      type: 'TEST_EVENT',
      category: 'underwriting',
      title: 'Test Notification',
      message: 'Test message',
    });
    expect(created.id).toBeDefined();
  });

  it('fetches notifications from Core API successfully', async () => {
    const mockApiResponse = {
      data: [
        {
          id: 'notif-1',
          type: 'APPLICATION_SUBMITTED',
          category: 'underwriting',
          severity: 'INFO',
          title: 'Aplikasi Baru',
          message: 'Detail pengajuan',
          link: '/queue',
          is_read: false,
          created_at: '2026-09-08T00:00:00Z',
        },
      ],
      total: 1,
      unread_count: 1,
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const repo = new CoreApiNotificationRepository('http://localhost:8080');
    const result = await repo.getNotifications({ unreadOnly: true });

    expect(result.total).toBe(1);
    expect(result.unreadCount).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('notif-1');
    expect(result.data[0].category).toBe('underwriting');
    expect(result.data[0].isRead).toBe(false);
  });

  it('fetches unread count from Core API successfully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unread_count: 7 }),
    } as Response);

    const repo = new CoreApiNotificationRepository('http://localhost:8080');
    const count = await repo.getUnreadCount();
    expect(count).toBe(7);
  });

  it('marks a notification as read via Core API', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'notif-1',
          is_read: true,
          read_at: '2026-09-08T01:00:00Z',
        },
      }),
    } as Response);

    const repo = new CoreApiNotificationRepository('http://localhost:8080');
    const res = await repo.markAsRead('notif-1');
    expect(res.id).toBe('notif-1');
    expect(res.isRead).toBe(true);
  });

  it('marks all notifications as read via Core API', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          updated_count: 5,
          unread_count: 0,
        },
      }),
    } as Response);

    const repo = new CoreApiNotificationRepository('http://localhost:8080');
    const res = await repo.markAllAsRead();
    expect(res.updatedCount).toBe(5);
    expect(res.unreadCount).toBe(0);
  });

  it('creates notification via Core API', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'notif-new',
          type: 'APPLICATION_SUBMITTED',
          category: 'underwriting',
          severity: 'INFO',
          title: 'Aplikasi Masuk',
          message: 'Deskripsi',
          link: '/queue',
          is_read: false,
          created_at: '2026-09-08T01:00:00Z',
        },
      }),
    } as Response);

    const repo = new CoreApiNotificationRepository('http://localhost:8080');
    const res = await repo.createNotification({
      type: 'APPLICATION_SUBMITTED',
      category: 'underwriting',
      title: 'Aplikasi Masuk',
      message: 'Deskripsi',
      link: '/queue',
    });

    expect(res.id).toBe('notif-new');
    expect(res.isRead).toBe(false);
  });

  it('falls back to mock repository when network fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const repo = new CoreApiNotificationRepository('http://localhost:8080');
    const res = await repo.getNotifications();
    expect(res.total).toBe(5);
    expect(res.unreadCount).toBe(3);
  });
});
