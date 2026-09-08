import React from 'react';
import { CMSLayout } from '@/components/templates/CMSLayout';
import { applicationService } from '@/server/di';
import { UnderwritingWorkbench } from './UnderwritingWorkbench';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface QueuePageProps {
  searchParams?: Promise<{ id?: string }>;
}

export default async function QueuePage(props: QueuePageProps) {
  const searchParams = await props.searchParams;
  const queue = await applicationService.getQueue();

  return (
    <CMSLayout pageTitle="Underwriting Queue & Workbench" currentPath="/queue">
      <UnderwritingWorkbench
        initialQueue={queue}
        initialSelectedId={searchParams?.id}
      />
    </CMSLayout>
  );
}
