import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeMockRepository } from './knowledge.mock.repository';

describe('KnowledgeMockRepository', () => {
  let repository: KnowledgeMockRepository;

  beforeEach(() => {
    repository = new KnowledgeMockRepository();
  });

  it('should get all seeded knowledge documents and support category and search filtering', async () => {
    const allDocs = await repository.getDocuments();
    expect(allDocs.length).toBe(6);

    const underwritingDocs = await repository.getDocuments('underwriting');
    expect(underwritingDocs.length).toBe(1);
    expect(underwritingDocs[0].id).toBe('doc_underwriting_up_medical');

    const searchResults = await repository.getDocuments(undefined, 'dukcapil');
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].title).toContain('Dukcapil');
  });

  it('should find documents by id and slug', async () => {
    const doc = await repository.getDocumentById('doc_underwriting_up_medical');
    expect(doc).not.toBeNull();
    expect(doc?.title).toContain('Batas Uang Pertanggungan');

    const notFound = await repository.getDocumentById('invalid_id');
    expect(notFound).toBeNull();

    const bySlug = await repository.getDocumentBySlug('pedoman-batas-up-dan-medical-check-up');
    expect(bySlug).not.toBeNull();

    const noSlug = await repository.getDocumentBySlug('invalid_slug');
    expect(noSlug).toBeNull();
  });

  it('should create a new knowledge document and prevent duplicate slugs', async () => {
    const created = await repository.createDocument({
      title: 'Panduan Penanganan Fraud OCR KTP',
      category: 'compliance',
      summary: 'Langkah investigasi ketika biometric score di bawah 70%',
      content: 'Lakukan panggilan video call liveness dan minta KTP fisik asli dengan hologram.',
      tags: ['fraud', 'ocr', 'biometrik'],
    });

    expect(created.id).toBe('doc_panduan_penanganan_fraud_ocr_ktp');
    expect(created.chunkCount).toBeGreaterThan(1);

    // Duplicate slug test
    await expect(
      repository.createDocument({
        title: 'Panduan Penanganan Fraud OCR KTP',
        category: 'compliance',
        summary: 'Duplicate',
        content: 'Duplicate content',
        tags: [],
      })
    ).rejects.toThrow('sudah ada');
  });

  it('should update, reindex, and delete documents', async () => {
    // Update
    const updated = await repository.updateDocument('doc_underwriting_up_medical', {
      title: 'Pedoman Batas UP & Medical Check-Up Terupdate 2026',
    });
    expect(updated.title).toBe('Pedoman Batas UP & Medical Check-Up Terupdate 2026');

    // Conflict slug update
    await expect(
      repository.updateDocument('doc_underwriting_up_medical', {
        slug: 'klausul-pengecualian-dan-waiting-period-penyakit-kritis',
      })
    ).rejects.toThrow('sudah digunakan');

    // Invalid ID update
    await expect(
      repository.updateDocument('invalid_id', {
        title: 'Test',
      })
    ).rejects.toThrow('tidak ditemukan');

    // Reindex
    const reindexed = await repository.reindexDocument('doc_underwriting_up_medical');
    expect(reindexed.status).toBe('indexed');

    await expect(repository.reindexDocument('invalid_id')).rejects.toThrow('tidak ditemukan');

    // Delete
    const deleted = await repository.deleteDocument('doc_underwriting_up_medical');
    expect(deleted).toBe(true);

    const verifyDeleted = await repository.getDocumentById('doc_underwriting_up_medical');
    expect(verifyDeleted).toBeNull();

    await expect(repository.deleteDocument('invalid_id')).rejects.toThrow('tidak ditemukan');
  });

  it('should return metrics for knowledge base', async () => {
    const metrics = await repository.getMetrics();
    expect(metrics.totalDocuments).toBe(6);
    expect(metrics.indexedDocuments).toBe(6);
    expect(metrics.vectorDimension).toBe(1024);
    expect(metrics.totalChunks).toBeGreaterThan(50);
  });

  it('should simulate RAG chat responses with citations', async () => {
    const result = await repository.simulateRagChat('Berapa batas UP tanpa medical check up?');
    expect(result.answer).toBeDefined();
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0].score).toBeGreaterThan(0.5);
    expect(result.latencyMs).toBeGreaterThan(0);

    // Empty query error
    await expect(repository.simulateRagChat('   ')).rejects.toThrow('tidak boleh kosong');
  });
});
