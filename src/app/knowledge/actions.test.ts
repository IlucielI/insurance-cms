import { describe, it, expect, vi } from 'vitest';
import {
  createKnowledgeDocAction,
  updateKnowledgeDocAction,
  deleteKnowledgeDocAction,
  reindexKnowledgeDocAction,
  simulateRagChatAction,
  fetchKnowledgeMetricsAction,
  fetchKnowledgeDocumentsAction,
} from './actions';
import { revalidatePath } from 'next/cache';

// Mock next/cache revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Knowledge Server Actions', () => {
  it('creates a new knowledge document and revalidates /knowledge', async () => {
    const result = await createKnowledgeDocAction({
      title: 'Action Test SOP',
      category: 'underwriting',
      summary: 'Ringkasan SOP',
      content: 'Isi lengkap teks SOP untuk pengujian server action.',
      tags: ['test', 'action'],
    });

    expect(result).toBeDefined();
    expect(result.title).toBe('Action Test SOP');
    expect(revalidatePath).toHaveBeenCalledWith('/knowledge');
  });

  it('updates an existing document and revalidates /knowledge', async () => {
    const targetId = 'doc_underwriting_up_medical';
    const result = await updateKnowledgeDocAction(targetId, {
      title: 'Updated Pedoman Title via Action',
    });

    expect(result).toBeDefined();
    expect(result.title).toBe('Updated Pedoman Title via Action');
    expect(revalidatePath).toHaveBeenCalledWith('/knowledge');
  });

  it('triggers document re-indexing and revalidates /knowledge', async () => {
    const targetId = 'doc_underwriting_up_medical';
    const result = await reindexKnowledgeDocAction(targetId);

    expect(result).toBeDefined();
    expect(result.status).toBe('indexed');
    expect(revalidatePath).toHaveBeenCalledWith('/knowledge');
  });

  it('deletes a document and revalidates /knowledge', async () => {
    // First create a temporary doc to delete
    const created = await createKnowledgeDocAction({
      title: 'Doc to Delete',
      category: 'company',
      summary: 'Temp',
      content: 'Temp content to be deleted',
      tags: ['temp'],
    });

    const success = await deleteKnowledgeDocAction(created.id);

    expect(success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/knowledge');
  });

  it('simulates RAG chat without throwing', async () => {
    const response = await simulateRagChatAction('Berapa limit non medical?', 'underwriting');

    expect(response).toBeDefined();
    expect(response.answer).toBeTruthy();
    expect(Array.isArray(response.sources)).toBe(true);
  });

  it('fetches knowledge metrics and documents list', async () => {
    const metrics = await fetchKnowledgeMetricsAction();
    expect(metrics).toBeDefined();
    expect(metrics.totalDocuments).toBeGreaterThan(0);

    const docs = await fetchKnowledgeDocumentsAction('underwriting');
    expect(Array.isArray(docs)).toBe(true);
  });
});
