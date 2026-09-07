import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationMockRepository } from './notification.mock.repository';

describe('NotificationMockRepository', () => {
  let repo: NotificationMockRepository;

  beforeEach(() => {
    repo = new NotificationMockRepository();
  });

  it('should initialize with default seed notifications having 3 unread', async () => {
    const unreadCount = await repo.getUnreadCount();
    expect(unreadCount).toBe(3);

    const result = await repo.getNotifications();
    expect(result.total).toBe(5);
    expect(result.unreadCount).toBe(3);
    expect(result.data).toHaveLength(5);
  });

  it('should filter notifications by unreadOnly', async () => {
    const result = await repo.getNotifications({ unreadOnly: true });
    expect(result.data).toHaveLength(3);
    result.data.forEach((item) => expect(item.isRead).toBe(false));
  });

  it('should filter notifications by category', async () => {
    const result = await repo.getNotifications({ category: 'knowledge' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].category).toBe('knowledge');
  });

  it('should filter notifications by severity', async () => {
    const result = await repo.getNotifications({ severity: 'WARNING' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].severity).toBe('WARNING');
  });

  it('should mark a single notification as read', async () => {
    const res = await repo.markAsRead('notif_seed_001');
    expect(res.isRead).toBe(true);
    expect(res.readAt).toBeDefined();

    const count = await repo.getUnreadCount();
    expect(count).toBe(2);
  });

  it('should throw error when marking non-existent notification', async () => {
    await expect(repo.markAsRead('unknown_id')).rejects.toThrow('not found');
  });

  it('should mark all notifications as read', async () => {
    const res = await repo.markAllAsRead();
    expect(res.updatedCount).toBe(3);
    expect(res.unreadCount).toBe(0);

    const count = await repo.getUnreadCount();
    expect(count).toBe(0);

    const list = await repo.getNotifications({ unreadOnly: true });
    expect(list.data).toHaveLength(0);
  });

  it('should create a new notification and increment unread count', async () => {
    const newItem = await repo.createNotification({
      type: 'DOCUMENT_UPLOADED',
      category: 'knowledge',
      severity: 'INFO',
      title: 'New Document Uploaded',
      message: 'Testing doc upload',
      link: '/knowledge',
    });

    expect(newItem.id).toBeDefined();
    expect(newItem.isRead).toBe(false);

    const count = await repo.getUnreadCount();
    expect(count).toBe(4);
  });
});
