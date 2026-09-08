'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Breadcrumb } from '@/components/molecules/Breadcrumb';
import { StatusPill } from '@/components/molecules/StatusPill';
import { UserChip } from '@/components/molecules/UserChip';
import { NotificationPopover } from './NotificationPopover';
import type { NotificationItem } from '@/server/repositories/notification.repository.interface';
import {
  fetchNotificationsAction,
  fetchUnreadCountAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/app/notifications/actions';

export interface TopbarProps {
  breadcrumbTitle?: string;
  onSync?: () => void;
  className?: string;
  initialNotifications?: NotificationItem[];
  initialUnreadCount?: number;
  disableAutoFetch?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbTitle = 'Dashboard & Kinerja Portofolio',
  className = '',
  initialNotifications,
  initialUnreadCount,
  disableAutoFetch = false,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotifications || []
  );
  const [unreadCount, setUnreadCount] = useState<number>(
    initialUnreadCount !== undefined ? initialUnreadCount : 3
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const [listResult, unread] = await Promise.all([
        fetchNotificationsAction(),
        fetchUnreadCountAction(),
      ]);
      setNotifications(listResult.data);
      setUnreadCount(unread);
    } catch {
      // Retain existing state if fetch fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!disableAutoFetch) {
      loadNotifications();
    }
  }, [disableAutoFetch, loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsReadAction(id);
    } catch {
      // Revert if error
      await loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsReadAction();
    } catch {
      // Revert if error
      await loadNotifications();
    }
  };

  return (
    <header
      className={`h-[70px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 ${className}`}
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center">
        <Breadcrumb current={breadcrumbTitle} />
      </div>

      {/* Right: Controls (Status, Notif, User) */}
      <div className="flex items-center gap-3.5">
        {/* Global Live Status Pill */}
        <StatusPill label="Core API v1.2 Online" status="online" />

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifikasi"
            aria-expanded={isNotifOpen}
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              isNotifOpen
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🔔
          </button>

          {/* Unread Badge Counter */}
          {unreadCount > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-white pointer-events-none transition-transform transform scale-100"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Popover Dropdown */}
          {isNotifOpen && (
            <NotificationPopover
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              notifications={notifications}
              unreadCount={unreadCount}
              isLoading={isLoading}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          )}
        </div>

        {/* User Profile Chip */}
        <div className="pl-1 border-l border-slate-200">
          <UserChip name="Bayu Pratama" role="Lead Underwriter" initials="BP" />
        </div>
      </div>
    </header>
  );
};
