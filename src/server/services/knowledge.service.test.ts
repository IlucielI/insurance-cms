import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeMockRepository } from '@/server/repositories/knowledge.mock.repository';

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  let repository: KnowledgeMockRepository;

  beforeEach(() => {
    repository = new KnowledgeMockRepository();
    service = new KnowledgeService(repository);
  });

  it('should delegate getDocuments and getMetrics to repository', async () => {
    const docs = await service.getDocuments();
    expect(docs.length).toBe(6);

    const metrics = await service.getMetrics();
    expect(metrics.totalDocuments).toBe(6);
  });

  it('should find document by id and slug with trimmed parameters', async () => {
    const doc = await service.getDocumentById('  doc_underwriting_up_medical  ');
    expect(doc?.id).toBe('doc_underwriting_up_medical');

    const emptyId = await service.getDocumentById('   ');
    expect(emptyId).toBeNull();

    const bySlug = await service.getDocumentBySlug('  pedoman-batas-up-dan-medical-check-up  ');
    expect(bySlug?.id).toBe('doc_underwriting_up_medical');

    const emptySlug = await service.getDocumentBySlug('');
    expect(emptySlug).toBeNull();
  });

  it('should validate inputs during createDocument', async () => {
    // Empty title
    await expect(
      service.createDocument({
        title: '   ',
        category: 'underwriting',
        summary: 'Summary',
        content: 'Long enough content',
        tags: [],
      })
    ).rejects.toThrow('Judul dokumen wajib diisi.');

    // Short content
    await expect(
      service.createDocument({
        title: 'Valid Title',
        category: 'underwriting',
        summary: 'Summary',
        content: 'Short',
        tags: [],
      })
    ).rejects.toThrow('Konten dokumen minimal 10 karakter.');

    // Valid create
    const created = await service.createDocument({
      title: 'Valid Document Title',
      category: 'underwriting',
      summary: 'Summary',
      content: 'Valid content that is more than 10 characters.',
      tags: ['test'],
    });
    expect(created.title).toBe('Valid Document Title');
  });

  it('should validate inputs during updateDocument', async () => {
    // Invalid ID
    await expect(service.updateDocument('  ', { title: 'Test' })).rejects.toThrow('ID dokumen tidak valid.');

    // Empty title
    await expect(
      service.updateDocument('doc_underwriting_up_medical', { title: '   ' })
    ).rejects.toThrow('Judul dokumen tidak boleh kosong.');

    // Short content
    await expect(
      service.updateDocument('doc_underwriting_up_medical', { content: 'Short' })
    ).rejects.toThrow('Konten dokumen minimal 10 karakter.');

    // Valid update
    const updated = await service.updateDocument('doc_underwriting_up_medical', {
      title: 'Updated Title',
    });
    expect(updated.title).toBe('Updated Title');
  });

  it('should validate deleteDocument and reindexDocument', async () => {
    await expect(service.deleteDocument('   ')).rejects.toThrow('ID dokumen tidak valid.');
    await expect(service.reindexDocument('   ')).rejects.toThrow('ID dokumen tidak valid.');

    const reindexed = await service.reindexDocument('doc_underwriting_up_medical');
    expect(reindexed.status).toBe('indexed');

    const deleted = await service.deleteDocument('doc_underwriting_up_medical');
    expect(deleted).toBe(true);
  });

  it('should validate and delegate simulateRagChat', async () => {
    await expect(service.simulateRagChat('   ')).rejects.toThrow('Pertanyaan prompt tidak boleh kosong.');

    const res = await service.simulateRagChat('Batas UP', 'underwriting');
    expect(res.answer).toBeDefined();
    expect(res.sources.length).toBeGreaterThan(0);
  });
});
