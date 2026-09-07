'use server';

import { revalidatePath } from 'next/cache';
import { notificationService } from '@/server/di';
import type {
  NotificationListResult,
  NotificationQueryFilter,
  NotificationItem,
  CreateNotificationInput,
} from '@/server/repositories/notification.repository.interface';

function safeRevalidate() {
  try {
    revalidatePath('/');
  } catch {
    // Ignore outside Next.js request context (e.g. in test environment)
  }
}

export async function fetchNotificationsAction(
  filter?: NotificationQueryFilter
): Promise<NotificationListResult> {
  return notificationService.getNotifications(filter);
}

export async function fetchUnreadCountAction(): Promise<number> {
  return notificationService.getUnreadCount();
}

export async function markNotificationAsReadAction(
  id: string
): Promise<{ id: string; isRead: boolean; readAt: string }> {
  const result = await notificationService.markAsRead(id);
  safeRevalidate();
  return result;
}

export async function markAllNotificationsAsReadAction(): Promise<{
  updatedCount: number;
  unreadCount: number;
}> {
  const result = await notificationService.markAllAsRead();
  safeRevalidate();
  return result;
}

export async function createNotificationAction(
  data: CreateNotificationInput
): Promise<NotificationItem> {
  const result = await notificationService.createNotification(data);
  safeRevalidate();
  return result;
}
