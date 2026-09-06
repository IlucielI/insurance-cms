import React from 'react';
import { CMSLayout } from '@/components/templates/CMSLayout';
import { knowledgeService } from '@/server/di';
import { KnowledgeBaseWorkbench } from './KnowledgeBaseWorkbench';

export default async function KnowledgePage() {
  const [documents, metrics] = await Promise.all([
    knowledgeService.getDocuments(),
    knowledgeService.getMetrics(),
  ]);

  return (
    <CMSLayout pageTitle="Knowledge Base AI & Underwriting Copilot" currentPath="/knowledge">
      <KnowledgeBaseWorkbench
        initialDocuments={documents}
        initialMetrics={metrics}
      />
    </CMSLayout>
  );
}
