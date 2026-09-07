import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoreApiKnowledgeRepository } from './knowledge.core-api.repository';
import { CreateKnowledgeDocDTO, UpdateKnowledgeDocDTO } from './knowledge.repository.interface';

describe('CoreApiKnowledgeRepository', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockCoreDoc = {
    id: 'doc-underwriting-up-medical',
    title: 'Pedoman Batas Uang Pertanggungan & Medical Check-Up',
    slug: 'pedoman-batas-up-dan-medical-check-up',
    category: 'underwriting',
    summary: 'Ketentuan limit uang pertanggungan tanpa MCU',
    content: 'Teks lengkap ketentuan MCU berdasarkan usia dan BMI.',
    tags: ['underwriting', 'medical'],
    chunk_count: 8,
    status: 'indexed',
    last_synced_at: '2026-09-07T12:00:00Z',
    updated_at: '2026-09-07T12:00:00Z',
  };

  it('fetches documents list with category and search filter', async () => {
    let requestedUrl = '';
    global.fetch = vi.fn().mockImplementation((url: string) => {
      requestedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [mockCoreDoc] }),
      });
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const docs = await repo.getDocuments('underwriting', 'medical');

    expect(requestedUrl).toContain('/api/v1/knowledge/documents?category=underwriting&search=medical');
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe(mockCoreDoc.id);
    expect(docs[0].chunkCount).toBe(8);
    expect(docs[0].tags).toEqual(['underwriting', 'medical']);
  });

  it('fetches document by id successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockCoreDoc }),
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const doc = await repo.getDocumentById('doc-underwriting-up-medical');

    expect(doc).not.toBeNull();
    expect(doc?.title).toBe(mockCoreDoc.title);
  });

  it('returns null when document id is not found (404)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'not found' }),
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const doc = await repo.getDocumentById('non-existent');

    expect(doc).toBeNull();
  });

  it('fetches document by slug successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockCoreDoc }),
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const doc = await repo.getDocumentBySlug('pedoman-batas-up-dan-medical-check-up');

    expect(doc).not.toBeNull();
    expect(doc?.slug).toBe(mockCoreDoc.slug);
  });

  it('creates a new knowledge document via POST', async () => {
    let capturedMethod = '';
    let capturedBody = '';

    global.fetch = vi.fn().mockImplementation((_url: string, options?: RequestInit) => {
      capturedMethod = options?.method || '';
      capturedBody = (options?.body as string) || '';
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: mockCoreDoc }),
      });
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const newDocDTO: CreateKnowledgeDocDTO = {
      title: mockCoreDoc.title,
      category: 'underwriting',
      summary: mockCoreDoc.summary,
      content: mockCoreDoc.content,
      tags: mockCoreDoc.tags,
    };

    const result = await repo.createDocument(newDocDTO);

    expect(capturedMethod).toBe('POST');
    expect(JSON.parse(capturedBody).title).toBe(mockCoreDoc.title);
    expect(result.id).toBe(mockCoreDoc.id);
  });

  it('updates an existing knowledge document via PUT', async () => {
    let capturedMethod = '';
    let capturedBody = '';

    global.fetch = vi.fn().mockImplementation((_url: string, options?: RequestInit) => {
      capturedMethod = options?.method || '';
      capturedBody = (options?.body as string) || '';
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { ...mockCoreDoc, title: 'Updated Title' } }),
      });
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const updateDTO: UpdateKnowledgeDocDTO = {
      title: 'Updated Title',
    };

    const result = await repo.updateDocument('doc-underwriting-up-medical', updateDTO);

    expect(capturedMethod).toBe('PUT');
    expect(JSON.parse(capturedBody).title).toBe('Updated Title');
    expect(result.title).toBe('Updated Title');
  });

  it('deletes document via DELETE and returns boolean', async () => {
    let capturedMethod = '';

    global.fetch = vi.fn().mockImplementation((_url: string, options?: RequestInit) => {
      capturedMethod = options?.method || '';
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'deleted successfully' }),
      });
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const success = await repo.deleteDocument('doc-underwriting-up-medical');

    expect(capturedMethod).toBe('DELETE');
    expect(success).toBe(true);
  });

  it('reindexes document via POST and returns updated document', async () => {
    let calledReindex = false;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/reindex')) {
        calledReindex = true;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: { document_id: mockCoreDoc.id, status: 'indexed' } }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockCoreDoc }),
      });
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const reindexed = await repo.reindexDocument('doc-underwriting-up-medical');

    expect(calledReindex).toBe(true);
    expect(reindexed.id).toBe(mockCoreDoc.id);
  });

  it('fetches knowledge metrics and maps to CMS contract', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            total_documents: 10,
            indexed_documents: 8,
            syncing_documents: 1,
            draft_documents: 1,
            total_chunks: 120,
            average_chunks_per_doc: 12.0,
            last_sync_time: '2026-09-07T12:00:00Z',
          },
        }),
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const metrics = await repo.getMetrics();

    expect(metrics.totalDocuments).toBe(10);
    expect(metrics.indexedDocuments).toBe(8);
    expect(metrics.syncingDocuments).toBe(1);
    expect(metrics.totalChunks).toBe(120);
    expect(metrics.indexHealthPercent).toBe(80);
    expect(metrics.vectorDimension).toBe(1024);
  });

  it('simulates RAG chat and returns sources citation', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            query: 'berapa limit non MCU?',
            answer: 'Batas non MCU adalah 500jt.',
            retrieved_chunks: [
              {
                id: 'chk-1',
                document_id: 'doc-underwriting-up-medical',
                title: 'Pedoman Underwriting',
                source_type: 'underwriting',
                content: 'Batas limit non MCU 500jt.',
                similarity: 0.895,
                chunk_index: 0,
              },
            ],
            execution_time_ms: 55,
          },
        }),
    });

    const repo = new CoreApiKnowledgeRepository('http://localhost:8080');
    const chatResp = await repo.simulateRagChat('berapa limit non MCU?', 'underwriting');

    expect(chatResp.answer).toBe('Batas non MCU adalah 500jt.');
    expect(chatResp.sources).toHaveLength(1);
    expect(chatResp.sources[0].title).toBe('Pedoman Underwriting');
    expect(chatResp.sources[0].score).toBe(0.895);
    expect(chatResp.latencyMs).toBe(55);
  });

  it('falls back to mock repository when baseUrl is empty', async () => {
    const repo = new CoreApiKnowledgeRepository('');
    const docs = await repo.getDocuments();

    expect(docs.length).toBeGreaterThan(0);
    const metrics = await repo.getMetrics();
    expect(metrics.totalDocuments).toBeGreaterThan(0);
  });
});
