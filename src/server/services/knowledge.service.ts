import {
  IKnowledgeRepository,
  KnowledgeDocument,
  KnowledgeCategory,
  KnowledgeMetrics,
  CreateKnowledgeDocDTO,
  UpdateKnowledgeDocDTO,
  SimulatedChatResponse,
} from '@/server/repositories/knowledge.repository.interface';
import { IKnowledgeService } from './knowledge.service.interface';

export class KnowledgeService implements IKnowledgeService {
  constructor(private readonly repository: IKnowledgeRepository) {}

  async getDocuments(category?: KnowledgeCategory, search?: string): Promise<KnowledgeDocument[]> {
    return this.repository.getDocuments(category, search);
  }

  async getDocumentById(id: string): Promise<KnowledgeDocument | null> {
    if (!id || !id.trim()) {
      return null;
    }
    return this.repository.getDocumentById(id.trim());
  }

  async getDocumentBySlug(slug: string): Promise<KnowledgeDocument | null> {
    if (!slug || !slug.trim()) {
      return null;
    }
    return this.repository.getDocumentBySlug(slug.trim());
  }

  async createDocument(dto: CreateKnowledgeDocDTO): Promise<KnowledgeDocument> {
    const trimmedTitle = dto.title?.trim();
    if (!trimmedTitle) {
      throw new Error('Judul dokumen wajib diisi.');
    }

    const trimmedContent = dto.content?.trim();
    if (!trimmedContent || trimmedContent.length < 10) {
      throw new Error('Konten dokumen minimal 10 karakter.');
    }

    return this.repository.createDocument({
      ...dto,
      title: trimmedTitle,
      summary: dto.summary?.trim() || trimmedTitle,
      content: trimmedContent,
      tags: dto.tags ?? [],
    });
  }

  async updateDocument(id: string, dto: UpdateKnowledgeDocDTO): Promise<KnowledgeDocument> {
    if (!id || !id.trim()) {
      throw new Error('ID dokumen tidak valid.');
    }

    if (dto.title !== undefined && !dto.title.trim()) {
      throw new Error('Judul dokumen tidak boleh kosong.');
    }

    if (dto.content !== undefined && dto.content.trim().length < 10) {
      throw new Error('Konten dokumen minimal 10 karakter.');
    }

    const cleanedDto: UpdateKnowledgeDocDTO = { ...dto };
    if (dto.title !== undefined) cleanedDto.title = dto.title.trim();
    if (dto.summary !== undefined) cleanedDto.summary = dto.summary.trim();
    if (dto.content !== undefined) cleanedDto.content = dto.content.trim();

    return this.repository.updateDocument(id.trim(), cleanedDto);
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (!id || !id.trim()) {
      throw new Error('ID dokumen tidak valid.');
    }
    return this.repository.deleteDocument(id.trim());
  }

  async reindexDocument(id: string): Promise<KnowledgeDocument> {
    if (!id || !id.trim()) {
      throw new Error('ID dokumen tidak valid.');
    }
    return this.repository.reindexDocument(id.trim());
  }

  async getMetrics(): Promise<KnowledgeMetrics> {
    return this.repository.getMetrics();
  }

  async simulateRagChat(
    query: string,
    categoryFilter?: KnowledgeCategory
  ): Promise<SimulatedChatResponse> {
    const cleanQuery = query?.trim();
    if (!cleanQuery) {
      throw new Error('Pertanyaan prompt tidak boleh kosong.');
    }
    return this.repository.simulateRagChat(cleanQuery, categoryFilter);
  }
}
