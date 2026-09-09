import React from 'react';
import { CMSLayout } from '@/components/templates/CMSLayout';
import { notificationService } from '@/server/di';
import { NotificationsWorkbench } from './NotificationsWorkbench';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotificationsPage() {
  const [listResult, unreadCount] = await Promise.all([
    notificationService.getNotifications(),
    notificationService.getUnreadCount(),
  ]);

  return (
    <CMSLayout pageTitle="Pusat Notifikasi & SLA Alerts" currentPath="/notifications">
      <NotificationsWorkbench
        initialNotifications={listResult.data}
        initialUnreadCount={unreadCount}
      />
    </CMSLayout>
  );
}
