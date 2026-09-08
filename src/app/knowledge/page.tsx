import React from 'react';
import { CMSLayout } from '@/components/templates/CMSLayout';
import { knowledgeService } from '@/server/di';
import { KnowledgeBaseWorkbench } from './KnowledgeBaseWorkbench';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KnowledgePage() {
  const [documents, metrics] = await Promise.all([
    knowledgeService.getDocuments(),
    knowledgeService.getMetrics(),
  ]);

  return (
    <CMSLayout pageTitle="Knowledge Base AI & pgvector RAG Manager" currentPath="/knowledge">
      <KnowledgeBaseWorkbench
        initialDocuments={documents}
        initialMetrics={metrics}
      />
    </CMSLayout>
  );
}
