export type KnowledgeCategory =
  | 'underwriting'
  | 'product'
  | 'claim_faq'
  | 'compliance'
  | 'company';

export type IndexingStatus = 'indexed' | 'syncing' | 'draft';

export interface KnowledgeDocument {
  id: string;
  title: string;
  slug: string;
  category: KnowledgeCategory;
  summary: string;
  content: string;
  tags: string[];
  chunkCount: number;
  status: IndexingStatus;
  lastSyncedAt: string;
  updatedAt: string;
}

export interface KnowledgeMetrics {
  totalDocuments: number;
  indexedDocuments: number;
  syncingDocuments: number;
  totalChunks: number;
  vectorDimension: number;
  modelName: string;
  avgLatencyMs: number;
  indexHealthPercent: number;
}

export interface KnowledgeSourceCitation {
  id: string;
  title: string;
  sourceType: string;
  score: number;
  excerpt: string;
}

export interface SimulatedChatResponse {
  answer: string;
  sources: KnowledgeSourceCitation[];
  latencyMs: number;
}

export interface CreateKnowledgeDocDTO {
  title: string;
  slug?: string;
  category: KnowledgeCategory;
  summary: string;
  content: string;
  tags: string[];
  status?: IndexingStatus;
}

export interface UpdateKnowledgeDocDTO {
  title?: string;
  slug?: string;
  category?: KnowledgeCategory;
  summary?: string;
  content?: string;
  tags?: string[];
  status?: IndexingStatus;
}

export interface IKnowledgeRepository {
  getDocuments(category?: KnowledgeCategory, search?: string): Promise<KnowledgeDocument[]>;
  getDocumentById(id: string): Promise<KnowledgeDocument | null>;
  getDocumentBySlug(slug: string): Promise<KnowledgeDocument | null>;
  createDocument(dto: CreateKnowledgeDocDTO): Promise<KnowledgeDocument>;
  updateDocument(id: string, dto: UpdateKnowledgeDocDTO): Promise<KnowledgeDocument>;
  deleteDocument(id: string): Promise<boolean>;
  reindexDocument(id: string): Promise<KnowledgeDocument>;
  getMetrics(): Promise<KnowledgeMetrics>;
  simulateRagChat(query: string, categoryFilter?: KnowledgeCategory): Promise<SimulatedChatResponse>;
}
