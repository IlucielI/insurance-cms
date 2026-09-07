import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notification.service';
import { INotificationRepository } from '../repositories/notification.repository.interface';

describe('NotificationService', () => {
  let mockRepo: INotificationRepository;
  let service: NotificationService;

  beforeEach(() => {
    mockRepo = {
      getNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      createNotification: vi.fn(),
    };
    service = new NotificationService(mockRepo);
  });

  it('delegates getNotifications to repository', async () => {
    const mockResult = { data: [], total: 0, unreadCount: 0 };
    vi.mocked(mockRepo.getNotifications).mockResolvedValueOnce(mockResult);

    const filter = { unreadOnly: true };
    const res = await service.getNotifications(filter);

    expect(mockRepo.getNotifications).toHaveBeenCalledWith(filter);
    expect(res).toBe(mockResult);
  });

  it('delegates getUnreadCount to repository', async () => {
    vi.mocked(mockRepo.getUnreadCount).mockResolvedValueOnce(5);

    const res = await service.getUnreadCount();
    expect(mockRepo.getUnreadCount).toHaveBeenCalled();
    expect(res).toBe(5);
  });

  it('throws error if id is empty when calling markAsRead', async () => {
    await expect(service.markAsRead('   ')).rejects.toThrow('id is required');
    expect(mockRepo.markAsRead).not.toHaveBeenCalled();
  });

  it('delegates markAsRead to repository with trimmed id', async () => {
    const mockResp = { id: 'notif-1', isRead: true, readAt: '2026-09-08T00:00:00Z' };
    vi.mocked(mockRepo.markAsRead).mockResolvedValueOnce(mockResp);

    const res = await service.markAsRead(' notif-1 ');
    expect(mockRepo.markAsRead).toHaveBeenCalledWith('notif-1');
    expect(res).toBe(mockResp);
  });

  it('delegates markAllAsRead to repository', async () => {
    const mockResp = { updatedCount: 4, unreadCount: 0 };
    vi.mocked(mockRepo.markAllAsRead).mockResolvedValueOnce(mockResp);

    const res = await service.markAllAsRead();
    expect(mockRepo.markAllAsRead).toHaveBeenCalled();
    expect(res).toBe(mockResp);
  });

  it('delegates createNotification to repository', async () => {
    const input = {
      type: 'EVENT',
      category: 'underwriting',
      title: 'Title',
      message: 'Msg',
    };
    const mockCreated = {
      id: 'notif-new',
      ...input,
      category: 'underwriting' as const,
      severity: 'INFO' as const,
      link: '',
      isRead: false,
      createdAt: '2026-09-08T00:00:00Z',
    };
    vi.mocked(mockRepo.createNotification).mockResolvedValueOnce(mockCreated);

    const res = await service.createNotification(input);
    expect(mockRepo.createNotification).toHaveBeenCalledWith(input);
    expect(res).toBe(mockCreated);
  });
});
