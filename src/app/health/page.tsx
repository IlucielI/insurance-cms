import React from 'react';
import { CMSLayout } from '@/components/templates/CMSLayout';
import { healthAuditService } from '@/server/di';
import { SystemHealthWorkbench } from './SystemHealthWorkbench';

export default async function HealthPage() {
  const overview = await healthAuditService.getSystemOverview();

  return (
    <CMSLayout pageTitle="System Health & Audit Trail" currentPath="/health">
      <SystemHealthWorkbench initialOverview={overview} />
    </CMSLayout>
  );
}
