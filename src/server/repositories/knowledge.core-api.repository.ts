import {
  IKnowledgeRepository,
  KnowledgeDocument,
  KnowledgeCategory,
  IndexingStatus,
  KnowledgeMetrics,
  SimulatedChatResponse,
  KnowledgeSourceCitation,
  CreateKnowledgeDocDTO,
  UpdateKnowledgeDocDTO,
} from './knowledge.repository.interface';
import { KnowledgeMockRepository } from './knowledge.mock.repository';

interface CoreApiDocumentItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  tags?: string[];
  chunk_count?: number;
  chunkCount?: number;
  status?: string;
  last_synced_at?: string;
  lastSyncedAt?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

interface CoreApiDocumentResponse {
  data: CoreApiDocumentItem;
}

interface CoreApiDocumentsListResponse {
  data: CoreApiDocumentItem[];
}

interface CoreApiKnowledgeMetricsResponse {
  data: {
    total_documents?: number;
    totalDocuments?: number;
    total_chunks?: number;
    totalChunks?: number;
    indexed_documents?: number;
    indexedDocuments?: number;
    syncing_documents?: number;
    syncingDocuments?: number;
    draft_documents?: number;
    draftDocuments?: number;
    average_chunks_per_doc?: number;
    averageChunksPerDoc?: number;
    category_breakdown?: Record<string, number>;
    categoryBreakdown?: Record<string, number>;
    last_sync_time?: string;
    lastSyncTime?: string;
    average_retrieval_latency_ms?: number;
    averageRetrievalLatencyMs?: number;
    grounding_accuracy_percent?: number;
    groundingAccuracyPercent?: number;
  };
}

interface CoreApiSimulateChatResponse {
  data: {
    query?: string;
    answer: string;
    retrieved_chunks?: Array<{
      id: string;
      document_id?: string;
      documentId?: string;
      title: string;
      source_type?: string;
      sourceType?: string;
      content: string;
      similarity: number;
      chunk_index?: number;
      chunkIndex?: number;
    }>;
    retrievedChunks?: Array<{
      id: string;
      document_id?: string;
      documentId?: string;
      title: string;
      source_type?: string;
      sourceType?: string;
      content: string;
      similarity: number;
      chunk_index?: number;
      chunkIndex?: number;
    }>;
    execution_time_ms?: number;
    executionTimeMs?: number;
  };
}

export class CoreApiKnowledgeRepository implements IKnowledgeRepository {
  private readonly baseUrl: string;
  private readonly mockFallback: KnowledgeMockRepository;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl !== undefined ? baseUrl : this.resolveBaseUrl();
    this.mockFallback = new KnowledgeMockRepository();
  }

  private resolveBaseUrl(): string {
    return process.env.CORE_API_URL?.trim() || '';
  }

  private mapDocument(item: CoreApiDocumentItem): KnowledgeDocument {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: (item.category as KnowledgeCategory) || 'underwriting',
      summary: item.summary,
      content: item.content,
      tags: Array.isArray(item.tags) ? item.tags : [],
      chunkCount: item.chunk_count ?? item.chunkCount ?? 0,
      status: (item.status as IndexingStatus) || 'indexed',
      lastSyncedAt: item.last_synced_at || item.lastSyncedAt || new Date().toISOString(),
      updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
    };
  }

  private async fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        let errorMsg = `Core API request failed: ${response.status} ${response.statusText}`;
        try {
          const errBody = await response.json();
          if (errBody?.error) {
            errorMsg = errBody.error;
          }
        } catch {
          // Keep standard status message
        }

        const err = new Error(errorMsg) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getDocuments(
    category?: KnowledgeCategory,
    search?: string
  ): Promise<KnowledgeDocument[]> {
    if (!this.baseUrl) {
      return this.mockFallback.getDocuments(category, search);
    }

    try {
      const params = new URLSearchParams();
      if (category && (category as string) !== 'all') {
        params.append('category', category);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await this.fetchApi<CoreApiDocumentsListResponse>(
        `/api/v1/knowledge/documents${query}`
      );

      if (!res?.data || !Array.isArray(res.data)) {
        return [];
      }

      return res.data.map((item) => this.mapDocument(item));
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.getDocuments(category, search);
    }
  }

  async getDocumentById(id: string): Promise<KnowledgeDocument | null> {
    if (!this.baseUrl) {
      return this.mockFallback.getDocumentById(id);
    }

    try {
      const res = await this.fetchApi<CoreApiDocumentResponse>(
        `/api/v1/knowledge/documents/${encodeURIComponent(id)}`
      );

      if (!res?.data) {
        return null;
      }

      return this.mapDocument(res.data);
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        return null;
      }
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.getDocumentById(id);
    }
  }

  async getDocumentBySlug(slug: string): Promise<KnowledgeDocument | null> {
    if (!this.baseUrl) {
      return this.mockFallback.getDocumentBySlug(slug);
    }

    try {
      const res = await this.fetchApi<CoreApiDocumentResponse>(
        `/api/v1/knowledge/documents/slug/${encodeURIComponent(slug)}`
      );

      if (!res?.data) {
        return null;
      }

      return this.mapDocument(res.data);
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        return null;
      }
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.getDocumentBySlug(slug);
    }
  }

  async createDocument(dto: CreateKnowledgeDocDTO): Promise<KnowledgeDocument> {
    if (!this.baseUrl) {
      return this.mockFallback.createDocument(dto);
    }

    try {
      const res = await this.fetchApi<CoreApiDocumentResponse>(
        '/api/v1/knowledge/documents',
        {
          method: 'POST',
          body: JSON.stringify(dto),
        }
      );

      return this.mapDocument(res.data);
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.createDocument(dto);
    }
  }

  async updateDocument(
    id: string,
    dto: UpdateKnowledgeDocDTO
  ): Promise<KnowledgeDocument> {
    if (!this.baseUrl) {
      return this.mockFallback.updateDocument(id, dto);
    }

    try {
      const res = await this.fetchApi<CoreApiDocumentResponse>(
        `/api/v1/knowledge/documents/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify(dto),
        }
      );

      return this.mapDocument(res.data);
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.updateDocument(id, dto);
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (!this.baseUrl) {
      return this.mockFallback.deleteDocument(id);
    }

    try {
      await this.fetchApi<{ message?: string }>(
        `/api/v1/knowledge/documents/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        }
      );
      return true;
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        return false;
      }
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.deleteDocument(id);
    }
  }

  async reindexDocument(id: string): Promise<KnowledgeDocument> {
    if (!this.baseUrl) {
      return this.mockFallback.reindexDocument(id);
    }

    try {
      await this.fetchApi<{ data?: unknown; message?: string }>(
        `/api/v1/knowledge/documents/${encodeURIComponent(id)}/reindex`,
        {
          method: 'POST',
        }
      );

      // Fetch the updated document state
      const updated = await this.getDocumentById(id);
      if (!updated) {
        throw new Error('Document not found after reindex');
      }
      return updated;
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.reindexDocument(id);
    }
  }

  async getMetrics(): Promise<KnowledgeMetrics> {
    if (!this.baseUrl) {
      return this.mockFallback.getMetrics();
    }

    try {
      const res = await this.fetchApi<CoreApiKnowledgeMetricsResponse>(
        '/api/v1/admin/knowledge/metrics'
      );

      const d = res?.data || {};
      const totalDocs = d.total_documents ?? d.totalDocuments ?? 0;
      const indexedDocs = d.indexed_documents ?? d.indexedDocuments ?? 0;
      const syncingDocs = d.syncing_documents ?? d.syncingDocuments ?? 0;
      const totalChunks = d.total_chunks ?? d.totalChunks ?? 0;

      const health =
        d.grounding_accuracy_percent ??
        d.groundingAccuracyPercent ??
        (totalDocs > 0 ? Math.round((indexedDocs / totalDocs) * 100) : 100);

      const latency =
        d.average_retrieval_latency_ms ??
        d.averageRetrievalLatencyMs ??
        1.8;

      return {
        totalDocuments: totalDocs,
        indexedDocuments: indexedDocs,
        syncingDocuments: syncingDocs,
        totalChunks: totalChunks,
        vectorDimension: 1024,
        modelName: 'BAAI/bge-m3 (1024-dim)',
        avgLatencyMs: Number(latency.toFixed(1)),
        indexHealthPercent: Math.round(health),
      };
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.getMetrics();
    }
  }

  async simulateRagChat(
    query: string,
    categoryFilter?: KnowledgeCategory
  ): Promise<SimulatedChatResponse> {
    if (!this.baseUrl) {
      return this.mockFallback.simulateRagChat(query, categoryFilter);
    }

    try {
      const body: { query: string; category?: string } = { query };
      if (categoryFilter && (categoryFilter as string) !== 'all') {
        body.category = categoryFilter;
      }

      const res = await this.fetchApi<CoreApiSimulateChatResponse>(
        '/api/v1/knowledge/simulate-chat',
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );

      const d = res?.data;
      const chunks = d?.retrieved_chunks || d?.retrievedChunks || [];

      const sources: KnowledgeSourceCitation[] = chunks.map((chk) => ({
        id: chk.id,
        title: chk.title,
        sourceType: chk.source_type || chk.sourceType || 'underwriting',
        score: chk.similarity,
        excerpt: chk.content,
      }));

      return {
        answer: d?.answer || '',
        sources,
        latencyMs: d?.execution_time_ms ?? d?.executionTimeMs ?? 45,
      };
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.simulateRagChat(query, categoryFilter);
    }
  }
}
