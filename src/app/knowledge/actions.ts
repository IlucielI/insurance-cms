'use server';

import { revalidatePath } from 'next/cache';
import { knowledgeService } from '@/server/di';
import {
  CreateKnowledgeDocDTO,
  KnowledgeCategory,
  KnowledgeDocument,
  KnowledgeMetrics,
  SimulatedChatResponse,
  UpdateKnowledgeDocDTO,
} from '@/server/repositories/knowledge.repository.interface';

function safeRevalidateKnowledge() {
  try {
    revalidatePath('/knowledge');
  } catch {
    // Ignore when called outside Next.js request context (e.g. in test environment)
  }
}

// Server Action to create a new knowledge document
export async function createKnowledgeDocAction(
  dto: CreateKnowledgeDocDTO
): Promise<KnowledgeDocument> {
  const created = await knowledgeService.createDocument(dto);
  safeRevalidateKnowledge();
  return created;
}

// Server Action to update an existing knowledge document
export async function updateKnowledgeDocAction(
  id: string,
  dto: UpdateKnowledgeDocDTO
): Promise<KnowledgeDocument> {
  const updated = await knowledgeService.updateDocument(id, dto);
  safeRevalidateKnowledge();
  return updated;
}

// Server Action to delete a knowledge document
export async function deleteKnowledgeDocAction(id: string): Promise<boolean> {
  const success = await knowledgeService.deleteDocument(id);
  safeRevalidateKnowledge();
  return success;
}

// Server Action to trigger document re-indexing into pgvector
export async function reindexKnowledgeDocAction(id: string): Promise<KnowledgeDocument> {
  const reindexed = await knowledgeService.reindexDocument(id);
  safeRevalidateKnowledge();
  return reindexed;
}

// Server Action to simulate RAG Copilot query
export async function simulateRagChatAction(
  query: string,
  categoryFilter?: KnowledgeCategory
): Promise<SimulatedChatResponse> {
  return knowledgeService.simulateRagChat(query, categoryFilter);
}

// Server Action to fetch the latest knowledge metrics
export async function fetchKnowledgeMetricsAction(): Promise<KnowledgeMetrics> {
  return knowledgeService.getMetrics();
}

// Server Action to query documents with category and search filter
export async function fetchKnowledgeDocumentsAction(
  category?: KnowledgeCategory,
  search?: string
): Promise<KnowledgeDocument[]> {
  return knowledgeService.getDocuments(category, search);
}
