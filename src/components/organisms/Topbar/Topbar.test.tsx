import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Topbar } from './Topbar';
import type { NotificationItem } from '@/server/repositories/notification.repository.interface';
import * as notificationActions from '@/app/notifications/actions';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Topbar & NotificationPopover', () => {
  const sampleNotifications: NotificationItem[] = [
    {
      id: 'notif-1',
      type: 'APPLICATION_SUBMITTED',
      category: 'underwriting',
      severity: 'INFO',
      title: 'Aplikasi Baru: Budi Santoso',
      message: 'Pengajuan polis baru masuk.',
      link: '/queue',
      isRead: false,
      createdAt: '2026-09-08T00:00:00Z',
    },
    {
      id: 'notif-2',
      type: 'SLA_WARNING',
      category: 'underwriting',
      severity: 'WARNING',
      title: 'SLA Warning: Aplikasi #APP-2',
      message: 'Tertahan lebih dari 20 jam.',
      link: '/queue',
      isRead: false,
      createdAt: '2026-09-08T00:00:00Z',
    },
    {
      id: 'notif-3',
      type: 'SYSTEM_ALERT',
      category: 'system',
      severity: 'SUCCESS',
      title: 'Audit Tamper Check Passed',
      message: 'Integritas 100%.',
      link: '/health',
      isRead: true,
      createdAt: '2026-09-07T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();

    vi.spyOn(notificationActions, 'fetchNotificationsAction').mockResolvedValue({
      data: sampleNotifications,
      total: 3,
      unreadCount: 2,
    });
    vi.spyOn(notificationActions, 'fetchUnreadCountAction').mockResolvedValue(2);
    vi.spyOn(notificationActions, 'markNotificationAsReadAction').mockResolvedValue({
      id: 'notif-1',
      isRead: true,
      readAt: new Date().toISOString(),
    });
    vi.spyOn(notificationActions, 'markAllNotificationsAsReadAction').mockResolvedValue({
      updatedCount: 2,
      unreadCount: 0,
    });
  });

  it('renders topbar controls and notification badge correctly', () => {
    render(
      <Topbar
        breadcrumbTitle="Dashboard & Kinerja Portofolio"
        initialNotifications={sampleNotifications}
        initialUnreadCount={2}
        disableAutoFetch
      />
    );

    expect(screen.getByText('Dashboard & Kinerja Portofolio')).toBeDefined();
    expect(screen.getByText('Core API v1.2 Online')).toBeDefined();
    expect(screen.queryByPlaceholderText('Cari metrik, polis, atau underwriting...')).toBeNull();
    expect(screen.queryByText('Refresh Data')).toBeNull();

    const badge = screen.getByTestId('notification-badge');
    expect(badge.textContent).toBe('2');
  });

  it('toggles notification popover when bell button is clicked', () => {
    render(
      <Topbar
        initialNotifications={sampleNotifications}
        initialUnreadCount={2}
        disableAutoFetch
      />
    );

    const bellBtn = screen.getByRole('button', { name: /notifikasi/i });
    expect(screen.queryByRole('dialog', { name: /panel notifikasi/i })).toBeNull();

    fireEvent.click(bellBtn);

    const popover = screen.getByRole('dialog', { name: /panel notifikasi/i });
    expect(popover).toBeDefined();
    expect(screen.getByText('Aplikasi Baru: Budi Santoso')).toBeDefined();
    expect(screen.getByText('SLA Warning: Aplikasi #APP-2')).toBeDefined();
    expect(screen.getByText('Audit Tamper Check Passed')).toBeDefined();

    // Clicking bell again closes it
    fireEvent.click(bellBtn);
    expect(screen.queryByRole('dialog', { name: /panel notifikasi/i })).toBeNull();
  });

  it('filters notifications by "Belum Dibaca" tab', () => {
    render(
      <Topbar
        initialNotifications={sampleNotifications}
        initialUnreadCount={2}
        disableAutoFetch
      />
    );

    const bellBtn = screen.getByRole('button', { name: /notifikasi/i });
    fireEvent.click(bellBtn);

    const unreadTab = screen.getByRole('button', { name: /belum dibaca/i });
    fireEvent.click(unreadTab);

    expect(screen.getByText('Aplikasi Baru: Budi Santoso')).toBeDefined();
    expect(screen.getByText('SLA Warning: Aplikasi #APP-2')).toBeDefined();
    expect(screen.queryByText('Audit Tamper Check Passed')).toBeNull();
  });

  it('marks all notifications as read and clears badge', async () => {
    render(
      <Topbar
        initialNotifications={sampleNotifications}
        initialUnreadCount={2}
        disableAutoFetch
      />
    );

    const bellBtn = screen.getByRole('button', { name: /notifikasi/i });
    fireEvent.click(bellBtn);

    const markAllBtn = screen.getByRole('button', { name: /tandai semua dibaca/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(notificationActions.markAllNotificationsAsReadAction).toHaveBeenCalled();
      expect(screen.queryByTestId('notification-badge')).toBeNull();
    });
  });

  it('marks single notification as read and contains navigation link when item is clicked', async () => {
    render(
      <Topbar
        initialNotifications={sampleNotifications}
        initialUnreadCount={2}
        disableAutoFetch
      />
    );

    const bellBtn = screen.getByRole('button', { name: /notifikasi/i });
    fireEvent.click(bellBtn);

    const notifItem = screen.getByText('Aplikasi Baru: Budi Santoso');
    const linkElement = notifItem.closest('a');
    expect(linkElement?.getAttribute('href')).toBe('/queue');

    fireEvent.click(notifItem);

    await waitFor(() => {
      expect(notificationActions.markNotificationAsReadAction).toHaveBeenCalledWith('notif-1');
    });
  });

  it('closes popover when Escape key is pressed', () => {
    render(
      <Topbar
        initialNotifications={sampleNotifications}
        initialUnreadCount={2}
        disableAutoFetch
      />
    );

    const bellBtn = screen.getByRole('button', { name: /notifikasi/i });
    fireEvent.click(bellBtn);

    expect(screen.getByRole('dialog', { name: /panel notifikasi/i })).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /panel notifikasi/i })).toBeNull();
  });
});
