import React from 'react';
import { CMSLayout } from '@/components/templates/CMSLayout';
import { healthAuditService } from '@/server/di';
import { SystemHealthWorkbench } from './SystemHealthWorkbench';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HealthPage() {
  const overview = await healthAuditService.getSystemOverview();

  return (
    <CMSLayout pageTitle="System Health, Telemetry & Audit Trail" currentPath="/health">
      <SystemHealthWorkbench initialOverview={overview} />
    </CMSLayout>
  );
}
