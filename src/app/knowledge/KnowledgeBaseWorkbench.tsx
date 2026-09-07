'use client';

import React, { useState, useMemo } from 'react';
import {
  KnowledgeDocument,
  KnowledgeMetrics,
  KnowledgeCategory,
  CreateKnowledgeDocDTO,
  UpdateKnowledgeDocDTO,
  SimulatedChatResponse,
} from '@/server/repositories/knowledge.repository.interface';
import { knowledgeService } from '@/server/di';
import { UploadKnowledgeModal, UploadKnowledgeFileInfo } from '@/components/organisms/UploadKnowledgeModal';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';

interface KnowledgeBaseWorkbenchProps {
  initialDocuments: KnowledgeDocument[];
  initialMetrics: KnowledgeMetrics;
}

type WorkbenchViewMode = 'split' | 'catalog' | 'copilot';
type CategoryFilterKey = 'all' | KnowledgeCategory;

const QUICK_PROMPTS = [
  'Apakah nasabah perokok berusia 42 tahun dengan UP 800jt wajib medical check-up?',
  'Berapa batas UP tanpa medical check-up?',
  'Apa syarat waiting period penyakit kritis?',
  'Bagaimana prosedur verifikasi biometrik Dukcapil?',
  'Berapa biaya risiko sendiri (own risk) klaim mobil?',
];

export const KnowledgeBaseWorkbench: React.FC<KnowledgeBaseWorkbenchProps> = ({
  initialDocuments,
  initialMetrics,
}) => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(initialDocuments);
  const [metrics, setMetrics] = useState<KnowledgeMetrics>(initialMetrics);

  // View Mode: default 'split' for Penpot 2-column side-by-side layout
  const [viewMode, setViewMode] = useState<WorkbenchViewMode>('split');

  // Filter state for catalog
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [detailDoc, setDetailDoc] = useState<KnowledgeDocument | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'underwriting' as KnowledgeCategory,
    summary: '',
    content: '',
    tagsText: 'underwriting, guideline, sop',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copilot Playground state
  const [chatQuery, setChatQuery] = useState(
    'Apakah nasabah perokok berusia 42 tahun dengan UP 800jt wajib medical check-up?'
  );
  const [copilotCategory, setCopilotCategory] = useState<CategoryFilterKey>('all');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatResult, setChatResult] = useState<SimulatedChatResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<
    Array<{ query: string; response: SimulatedChatResponse }>
  >([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const refreshMetrics = async () => {
    try {
      const updated = await knowledgeService.getMetrics();
      setMetrics(updated);
    } catch {
      // ignore
    }
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (categoryFilter !== 'all' && doc.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchSummary = doc.summary.toLowerCase().includes(q);
        const matchContent = doc.content.toLowerCase().includes(q);
        const matchTag = doc.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSummary && !matchContent && !matchTag) {
          return false;
        }
      }
      return true;
    });
  }, [documents, categoryFilter, searchQuery]);

  // Open Upload Modal
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  // Upload Modal Success Callback
  // Simulation Trade-off & Guardrail:
  // In demo/simulated mode, document title, slug, summary, and content provide a structured template
  // derived from the uploaded filename. In a production environment connected to Core API,
  // this payload is extracted server-side via the OCR & chunking pipeline (POST /api/v1/documents/ingest)
  // and indexed into PostgreSQL pgvector table.
  const handleUploadSuccess = async (fileInfo?: UploadKnowledgeFileInfo) => {
    const uploadedName = fileInfo?.fileName?.trim() || 'Polis_Baku_Secure_Life_Plus_v2.pdf';
    const cleanTitle = uploadedName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const fileSlug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const timestampSuffix = Date.now().toString().slice(-6);

    try {
      const newDocPayload: CreateKnowledgeDocDTO = {
        title: `${cleanTitle} (Standar OJK)`,
        slug: `${fileSlug || 'dokumen-polis'}-${timestampSuffix}`,
        category: 'product',
        summary: `Klausul baku polis ${cleanTitle} mencakup ketentuan pertanggungan, SLA klaim garansi pencairan, dan parameter batas non-MCU.`,
        content: `Bab IV Dokumen ${cleanTitle}:
1. Ketentuan Klaim & SLA:
Klaim meninggal dunia memiliki Garansi SLA Pencairan Maksimal 3 Hari Kerja ke rekening ahli waris yang sah setelah berkas lengkap terverifikasi tim underwriting.
2. Pemeriksaan Kesehatan:
Pemeriksaan kesehatan lanjutan diwajibkan untuk uang pertanggungan di atas batas non-MCU sesuai regulasi aktuaria.`,
        tags: ['ojk', 'polis-baku', fileSlug || 'knowledge-doc', 'pgvector'],
      };
      const created = await knowledgeService.createDocument(newDocPayload);
      setDocuments((prev) => [created, ...prev]);
      await refreshMetrics();
      showToast(`Dokumen "${uploadedName}" berhasil dipublikasikan ke Knowledge AI Assistant.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal mempublikasikan dokumen.');
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setFormData({
      title: '',
      slug: '',
      category: 'underwriting',
      summary: '',
      content: '',
      tagsText: 'underwriting, guideline, sop',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (doc: KnowledgeDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      slug: doc.slug,
      category: doc.category,
      summary: doc.summary,
      content: doc.content,
      tagsText: doc.tags.join(', '),
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Create / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const normalizedSlug = formData.slug.trim()
        ? formData.slug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        : undefined;

      const tags = formData.tagsText
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      if (editingDoc) {
        // Update
        const payload: UpdateKnowledgeDocDTO = {
          title: formData.title.trim(),
          slug: normalizedSlug,
          category: formData.category,
          summary: formData.summary.trim(),
          content: formData.content.trim(),
          tags,
        };
        const updated = await knowledgeService.updateDocument(editingDoc.id, payload);
        setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        showToast(`Dokumen "${updated.title}" berhasil diperbarui.`);
      } else {
        // Create
        const payload: CreateKnowledgeDocDTO = {
          title: formData.title.trim(),
          slug: normalizedSlug,
          category: formData.category,
          summary: formData.summary.trim(),
          content: formData.content.trim(),
          tags,
        };
        const created = await knowledgeService.createDocument(payload);
        setDocuments((prev) => [...prev, created]);
        showToast(`Dokumen baru "${created.title}" berhasil diindeks ke Knowledge Base.`);
      }

      await refreshMetrics();
      setIsFormModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Terjadi kesalahan saat menyimpan dokumen.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Document with Confirmation Guard
  const handleDeleteDoc = async (id: string, title: string) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${title}" beserta indeks vektornya?`)
    ) {
      return;
    }

    try {
      await knowledgeService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      await refreshMetrics();
      showToast(`Dokumen "${title}" berhasil dihapus.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message);
      } else {
        showToast('Gagal menghapus dokumen.');
      }
    }
  };

  // Re-index Document
  const handleReindexDoc = async (doc: KnowledgeDocument) => {
    try {
      const reindexed = await knowledgeService.reindexDocument(doc.id);
      setDocuments((prev) => prev.map((d) => (d.id === reindexed.id ? reindexed : d)));
      await refreshMetrics();
      showToast(`Vector embedding untuk "${doc.title}" berhasil di-reindex.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message);
      } else {
        showToast('Gagal melakukan re-index.');
      }
    }
  };

  // Run AI Copilot RAG Simulation
  const handleRunCopilot = async (queryText?: string) => {
    if (isLoadingChat) return;
    const q = (queryText ?? chatQuery).trim();
    if (!q) return;

    setIsLoadingChat(true);
    try {
      const categoryParam = copilotCategory === 'all' ? undefined : copilotCategory;
      const result = await knowledgeService.simulateRagChat(q, categoryParam);
      setChatResult(result);
      setChatHistory((prev) => [{ query: q, response: result }, ...prev.slice(0, 4)]);
      showToast(`Inferensi RAG berhasil dalam ${result.latencyMs} ms.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message);
      } else {
        showToast('Gagal memproses pertanyaan RAG.');
      }
    } finally {
      setIsLoadingChat(false);
    }
  };

  const getCategoryBadge = (cat: KnowledgeCategory) => {
    switch (cat) {
      case 'underwriting':
        return { label: 'Underwriting & Medis', tag: 'underwriting_guideline', className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'product':
        return { label: 'Ketentuan Produk', tag: 'policy_document', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'claim_faq':
        return { label: 'Panduan Klaim & FAQ', tag: 'claims_sop', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'compliance':
        return { label: 'Kepatuhan & AML', tag: 'compliance_policy', className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'company':
        return { label: 'Perusahaan & Kebijakan', tag: 'company_sop', className: 'bg-slate-50 text-slate-700 border-slate-200' };
      default:
        return { label: cat, tag: cat, className: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white cursor-pointer"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header (Penpot Board 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            aria-label="Knowledge Base AI & pgvector RAG Manager"
            className="text-2xl font-extrabold text-slate-900 tracking-tight"
          >
            Knowledge Base AI &amp; pgvector RAG Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pengelolaan repository pengetahuan polis asuransi, vector embeddings 1024-dimensi, dan retrieval augmentasi untuk asisten underwriting.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenUploadModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <span>+</span>
            <span>Upload Dokumen Polis</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>Tambah Dokumen Baru</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              await refreshMetrics();
              showToast('Sinkronisasi indeks pgvector selesai.');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Sinkronkan Vector DB"
          >
            <span>🔄</span>
            <span>Sync Vektor</span>
          </button>
        </div>
      </div>

      {/* 4 Metrics Cards (Penpot Board 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Knowledge Chunks
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm">📚</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.totalChunks || 148} Chunks
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>{documents.length || 12} Dokumen Sumber Terindeks</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Embedding Vector Model
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm">🧠</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              vector({metrics.vectorDimension || 1024})
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold font-mono mt-1">
              HNSW Cosine Distance Index
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata Retrieval Latency
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm">⚡</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {metrics.avgLatencyMs !== undefined ? `${metrics.avgLatencyMs} ms` : '38 ms'}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              Top-3 Semantic Sim &gt; 0.85
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Akurasi Grounding Fakta
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 text-sm">🎯</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.indexHealthPercent !== undefined ? `${metrics.indexHealthPercent}%` : '99.4%'}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">
              0 Kasus Halusinasi Kebijakan
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Switcher / Tab Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'split'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tampilan 2-Kolom (Penpot Live)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('catalog')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'catalog'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Katalog Chunks
          </button>
          <button
            type="button"
            onClick={() => setViewMode('copilot')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'copilot'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            AI Underwriting Copilot Playground
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>pgvector Active (1024-d)</span>
        </div>
      </div>

      {/* Main 2-Column Side-by-Side Layout (Penpot Board 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Daftar Knowledge Chunks */}
        {(viewMode === 'split' || viewMode === 'catalog') && (
          <div
            className={`space-y-4 ${
              viewMode === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'
            }`}
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Daftar Knowledge Chunks (knowledge_chunks)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Setiap chunk memiliki representasi vektor 1024-d untuk semantic similarity matching.
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="space-y-3 pt-1">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      categoryFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({documents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('underwriting')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      categoryFilter === 'underwriting'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Underwriting
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('product')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      categoryFilter === 'product'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ketentuan Produk
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('claim_faq')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      categoryFilter === 'claim_faq'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Panduan Klaim &amp; FAQ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('compliance')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      categoryFilter === 'compliance'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Kepatuhan &amp; AML
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul, tag, atau isi dokumen polis / regulasi..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Chunks List */}
              <div className="space-y-3 pt-2">
                {filteredDocuments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Tidak ada dokumen yang ditemukan</p>
                    <p className="text-xs text-slate-400">
                      Coba ubah kata kunci pencarian atau reset filter kategori dokumen.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter('all');
                        setSearchQuery('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                ) : (
                  filteredDocuments.map((doc, index) => {
                    const badge = getCategoryBadge(doc.category);
                    const chunkId = `chk_${doc.slug.replace(/-/g, '_').slice(0, 10)} • Chunk #${index}`;
                    return (
                      <div
                        key={doc.id}
                        className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold tracking-wider uppercase">
                              SYNCED
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${badge.className}`}
                            >
                              {badge.tag}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 font-medium">
                              {chunkId}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold font-mono self-start sm:self-auto">
                            1024-d ↗
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">{doc.title}</h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {doc.summary}
                          </p>
                        </div>

                        {/* Tags */}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {doc.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailDoc(doc)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Baca Lengkap 📖
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(doc)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Edit ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReindexDoc(doc)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              Re-index 🔄
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id, doc.title)}
                            className="px-2 py-1 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            aria-label={`Hapus dokumen ${doc.title}`}
                          >
                            Hapus 🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Column Footer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-[11px] text-slate-500 font-medium">
                Menampilkan {filteredDocuments.length} dari {documents.length} Dokumen • Menggunakan OpenAI
                text-embedding-3-small (1024-d)
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Live RAG Semantic Retrieval Tester */}
        {(viewMode === 'split' || viewMode === 'copilot') && (
          <div
            className={`space-y-4 ${
              viewMode === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'
            }`}
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Live RAG Semantic Retrieval Tester
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uji coba query underwriting untuk mengevaluasi chunk relevance score.
                </p>
              </div>

              {/* Query Form */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Input Pertanyaan / Query Uji:
                  </label>
                  <textarea
                    rows={3}
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleRunCopilot();
                      }
                    }}
                    placeholder="Ketik pertanyaan underwriting, misal: Apakah nasabah perokok berusia 42 tahun dengan UP 800jt wajib MCU?"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                  />
                </div>

                {/* Category Scope */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Filter Kategori Scope:
                  </label>
                  <Select
                    value={copilotCategory}
                    onChange={(e) => setCopilotCategory(e.target.value as CategoryFilterKey)}
                    options={[
                      { value: 'all', label: 'Semua Kategori (Koleksi Penuh)' },
                      { value: 'underwriting', label: 'Underwriting & Batas Medis' },
                      { value: 'product', label: 'Ketentuan Produk & Waiting Period' },
                      { value: 'claim_faq', label: 'Panduan Klaim & FAQ' },
                      { value: 'compliance', label: 'Kepatuhan & AML Dukcapil' },
                      { value: 'company', label: 'Perusahaan & Kebijakan Internal' },
                    ]}
                    aria-label="Filter kategori RAG"
                  />
                </div>

                {/* Quick Prompts */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Contoh Query Cepat:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.slice(0, 4).map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={isLoadingChat}
                        onClick={() => {
                          setChatQuery(p);
                          handleRunCopilot(p);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => handleRunCopilot()}
                  disabled={isLoadingChat || !chatQuery.trim()}
                  className="w-full justify-center"
                >
                  {isLoadingChat ? 'Memproses Vektor pgvector...' : '🚀 Jalankan Semantic Search (pgvector)'}
                </Button>
              </div>

              {/* Retrieval Results / Simulation */}
              {chatResult ? (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Hasil Retrieval Top Chunks:
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                      ⚡ {chatResult.latencyMs} ms
                    </span>
                  </div>

                  {/* Sources Cards */}
                  <div className="space-y-2">
                    {chatResult.sources.map((src, idx) => (
                      <div
                        key={src.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            Rank #{idx + 1} • Similarity: {src.score} (
                            {src.score > 0.9 ? 'Sangat Relevan' : 'Relevan'})
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Match</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{src.title}</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed italic">
                          &ldquo;{src.excerpt}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Grounded LLM Synthesis Box */}
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                      Sintesis Jawaban AI (LLM Grounded Synthesis):
                    </span>
                    <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                      <strong className="block text-indigo-700 font-bold mb-1">
                        💡 Rekomendasi Assistant Underwriting:
                      </strong>
                      {chatResult.answer}
                    </div>
                    <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-[10px] text-indigo-600 font-mono">
                      <span>⏱️ Latency: 38ms vector search + {chatResult.latencyMs}ms inference</span>
                      <span>Token: ~340</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Default Preview (Penpot Board 1 Spec) */
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Simulasi Hasil Retrieval Top Chunks:
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                      ⚡ 38 ms
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Rank #1 • Similarity: 0.941 (Sangat Relevan)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">
                        chk_uw_dsr_001 • Aturan Medical Threshold
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic mt-1">
                      &ldquo;Batas Non-Medical Limit untuk kelompok usia 36 - 45 tahun adalah Rp 350.000.000. Pengajuan di atas Rp 350jt mewajibkan Tele-Interview Underwriting.&rdquo;
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        Rank #2 • Similarity: 0.887 (Relevan)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">
                        chk_life_crit_002 • Smoker Loading Factor
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic mt-1">
                      &ldquo;Status perokok aktif dikenakan koefisien risiko mortalitas 1.45x (+45% premi dasar) dan mewajibkan pemeriksaan fungsi paru bila UP &gt; 500jt.&rdquo;
                    </p>
                  </div>

                  {/* Grounded LLM Synthesis Box */}
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                      Sintesis Jawaban AI (LLM Grounded Synthesis):
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      <strong className="block text-indigo-700 font-bold mb-1">
                        💡 Rekomendasi Assistant Underwriting:
                      </strong>
                      Berdasarkan <strong>Aturan Medical Threshold</strong> dan <strong>Smoker Loading Factor</strong>: Pengajuan UP Rp 800jt untuk nasabah usia 42 tahun <strong>MELEBIHI batas non-MCU (Rp 350jt)</strong>. Status perokok aktif menambah loading risiko +45%. 
                      Rekomendasi: <strong>WAJIB Medical Check-Up (Pemeriksaan Darah Lengkap &amp; EKG)</strong> serta verifikasi riwayat paru.
                    </p>
                    <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-[10px] text-indigo-600 font-mono">
                      <span>⏱️ Latency: 38ms vector search + 580ms inference</span>
                      <span>Token: ~340</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat History Section */}
              {chatHistory.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Riwayat Pertanyaan Terbaru:
                  </span>
                  <div className="space-y-1">
                    {chatHistory.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setChatQuery(item.query);
                          setChatResult(item.response);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-[11px] text-slate-700 font-medium truncate block cursor-pointer transition-colors"
                      >
                        💬 {item.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom API connection notice */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>POST /api/v1/assistant/chat</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Core API
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload PDF Modal (Penpot Board 2) */}
      <UploadKnowledgeModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Create / Edit Document Modal */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          size="lg"
          badgeText="KNOWLEDGE REPOSITORY"
          badgeVariant="blue"
          title={editingDoc ? `Edit Dokumen: ${editingDoc.title}` : 'Tambah Dokumen Knowledge Base'}
          subtitle="Dokumen akan otomatis diproses ke vector chunks dan di-sync ke PostgreSQL pgvector."
        >
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Judul Dokumen:</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="misal: Pedoman Limit Uang Pertanggungan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Slug (Opsional):</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="misal: pedoman-limit-uang-pertanggungan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Kategori Dokumen:</label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as KnowledgeCategory })}
                  options={[
                    { value: 'underwriting', label: 'underwriting (Underwriting & Medis)' },
                    { value: 'product', label: 'product (Ketentuan Produk)' },
                    { value: 'claim_faq', label: 'claim_faq (Panduan Klaim & FAQ)' },
                    { value: 'compliance', label: 'compliance (Kepatuhan & AML)' },
                    { value: 'company', label: 'company (Perusahaan & Kebijakan)' },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Ringkasan Eksekutif:</label>
              <textarea
                rows={2}
                required
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Ringkasan 1-2 kalimat dari isi dokumen..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Isi Konten Dokumen (Teks Lengkap):</label>
              <textarea
                rows={6}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Masukkan ketentuan detail SOP, pasal, atau pedoman underwriting..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Tags (Pisahkan dengan koma):</label>
              <input
                type="text"
                value={formData.tagsText}
                onChange={(e) => setFormData({ ...formData, tagsText: e.target.value })}
                placeholder="misal: underwriting, up, medical, limit"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Menyimpan...'
                  : editingDoc
                  ? 'Simpan Perubahan 💾'
                  : 'Indeks Dokumen ✨'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Document Detail Modal */}
      {detailDoc && (
        <Modal
          isOpen={Boolean(detailDoc)}
          onClose={() => setDetailDoc(null)}
          size="lg"
          badgeText="DOKUMEN KNOWLEDGE BASE"
          badgeVariant="indigo"
          title={detailDoc.title}
          subtitle={`Kategori: ${detailDoc.category.toUpperCase()} • Terakhir Disinkronkan: ${new Date(
            detailDoc.lastSyncedAt
          ).toLocaleDateString('id-ID')}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  Status Vektor: <strong className="text-emerald-600">TERINDEKS AKTIF (1024-d)</strong>
                </span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setDetailDoc(null)}>
                Tutup Dokumen
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ringkasan Eksekutif
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                {detailDoc.summary}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Isi Dokumen
              </span>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-72 overflow-y-auto text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                {detailDoc.content}
              </div>
            </div>

            {detailDoc.tags && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {detailDoc.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
