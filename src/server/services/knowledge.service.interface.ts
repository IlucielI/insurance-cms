import {
  KnowledgeDocument,
  KnowledgeCategory,
  KnowledgeMetrics,
  CreateKnowledgeDocDTO,
  UpdateKnowledgeDocDTO,
  SimulatedChatResponse,
} from '@/server/repositories/knowledge.repository.interface';

export interface IKnowledgeService {
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
