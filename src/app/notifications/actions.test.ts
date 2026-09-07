import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchNotificationsAction,
  fetchUnreadCountAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  createNotificationAction,
} from './actions';
import { notificationService } from '@/server/di';

describe('Notification Server Actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchNotificationsAction delegates to notificationService.getNotifications', async () => {
    const mockResult = {
      data: [
        {
          id: 'n1',
          type: 'APPLICATION_SUBMITTED',
          category: 'underwriting' as const,
          severity: 'INFO' as const,
          title: 'Title',
          message: 'Msg',
          link: '/queue',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      unreadCount: 1,
    };
    vi.spyOn(notificationService, 'getNotifications').mockResolvedValueOnce(mockResult);

    const filter = { unreadOnly: true };
    const res = await fetchNotificationsAction(filter);

    expect(res).toEqual(mockResult);
    expect(notificationService.getNotifications).toHaveBeenCalledWith(filter);
  });

  it('fetchUnreadCountAction delegates to notificationService.getUnreadCount', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValueOnce(4);

    const count = await fetchUnreadCountAction();
    expect(count).toBe(4);
    expect(notificationService.getUnreadCount).toHaveBeenCalled();
  });

  it('markNotificationAsReadAction delegates to notificationService.markAsRead', async () => {
    const mockResp = { id: 'n1', isRead: true, readAt: '2026-09-08T00:00:00Z' };
    vi.spyOn(notificationService, 'markAsRead').mockResolvedValueOnce(mockResp);

    const res = await markNotificationAsReadAction('n1');
    expect(res).toEqual(mockResp);
    expect(notificationService.markAsRead).toHaveBeenCalledWith('n1');
  });

  it('markAllNotificationsAsReadAction delegates to notificationService.markAllAsRead', async () => {
    const mockResp = { updatedCount: 3, unreadCount: 0 };
    vi.spyOn(notificationService, 'markAllAsRead').mockResolvedValueOnce(mockResp);

    const res = await markAllNotificationsAsReadAction();
    expect(res).toEqual(mockResp);
    expect(notificationService.markAllAsRead).toHaveBeenCalled();
  });

  it('createNotificationAction delegates to notificationService.createNotification', async () => {
    const input = {
      type: 'EVENT',
      category: 'system',
      title: 'Alert',
      message: 'System alert message',
    };
    const mockItem = {
      id: 'n-new',
      ...input,
      category: 'system' as const,
      severity: 'INFO' as const,
      link: '',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    vi.spyOn(notificationService, 'createNotification').mockResolvedValueOnce(mockItem);

    const res = await createNotificationAction(input);
    expect(res).toEqual(mockItem);
    expect(notificationService.createNotification).toHaveBeenCalledWith(input);
  });
});
