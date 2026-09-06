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

interface KnowledgeBaseWorkbenchProps {
  initialDocuments: KnowledgeDocument[];
  initialMetrics: KnowledgeMetrics;
}

type WorkbenchTab = 'catalog' | 'copilot';
type CategoryFilterKey = 'all' | KnowledgeCategory;

const QUICK_PROMPTS = [
  'Berapa batas UP tanpa medical check-up?',
  'Apa syarat waiting period penyakit kritis?',
  'Bagaimana prosedur verifikasi biometrik Dukcapil?',
  'Berapa biaya risiko sendiri (own risk) klaim mobil?',
];

export const KnowledgeBaseWorkbench: React.FC<KnowledgeBaseWorkbenchProps> = ({
  initialDocuments,
  initialMetrics,
}) => {
  const [documents, setProducts] = useState<KnowledgeDocument[]>(initialDocuments);
  const [metrics, setMetrics] = useState<KnowledgeMetrics>(initialMetrics);

  // Active view tab
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('catalog');

  // Filter state for catalog
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
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
    tagsText: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copilot Playground state
  const [chatQuery, setChatQuery] = useState('');
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
      const tags = formData.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingDoc) {
        // Update
        const payload: UpdateKnowledgeDocDTO = {
          title: formData.title,
          slug: formData.slug,
          category: formData.category,
          summary: formData.summary,
          content: formData.content,
          tags,
        };
        const updated = await knowledgeService.updateDocument(editingDoc.id, payload);
        setProducts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        showToast(`Dokumen "${updated.title}" berhasil diperbarui.`);
      } else {
        // Create
        const payload: CreateKnowledgeDocDTO = {
          title: formData.title,
          slug: formData.slug || undefined,
          category: formData.category,
          summary: formData.summary,
          content: formData.content,
          tags,
        };
        const created = await knowledgeService.createDocument(payload);
        setProducts((prev) => [...prev, created]);
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

  // Delete Document
  const handleDeleteDoc = async (id: string, title: string) => {
    try {
      await knowledgeService.deleteDocument(id);
      setProducts((prev) => prev.filter((d) => d.id !== id));
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
      setProducts((prev) => prev.map((d) => (d.id === reindexed.id ? reindexed : d)));
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
        return { label: 'Underwriting & Medis', className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'product':
        return { label: 'Ketentuan Produk', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'claim_faq':
        return { label: 'Panduan Klaim & FAQ', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'compliance':
        return { label: 'Kepatuhan & AML', className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'company':
        return { label: 'Perusahaan & Kebijakan', className: 'bg-slate-50 text-slate-700 border-slate-200' };
      default:
        return { label: cat, className: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss toast"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Knowledge Base AI & Underwriting Copilot
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Basis pengetahuan RAG (Retrieval-Augmented Generation), indeks vektor 1024-dim, dan asisten inferensi underwriting Core API.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <span>✨</span>
            <span>Tambah Dokumen Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Dokumen Knowledge
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm">📚</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.totalDocuments} <span className="text-sm font-normal text-slate-500">Dokumen</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              ✓ {metrics.indexedDocuments} Terindeks Penuh
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Vektor Chunks
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm">🧩</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.totalChunks} <span className="text-sm font-normal text-slate-500">Chunks</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Dimensi {metrics.vectorDimension}-dim pgvector
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Model Embedding & LLM
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm">🧠</span>
          </div>
          <div className="mt-3">
            <div className="text-base font-extrabold text-slate-900 truncate">
              {metrics.modelName}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              Live Pipeline Active
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata Latensi RAG
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 text-sm">⚡</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.avgLatencyMs} <span className="text-sm font-normal text-slate-500">ms</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Kesehatan Indeks {metrics.indexHealthPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'catalog'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📚</span>
          <span>Katalog Basis Pengetahuan ({documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('copilot')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'copilot'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>🤖</span>
          <span>AI Underwriting Copilot Playground</span>
        </button>
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semua ({documents.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('underwriting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'underwriting'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Underwriting ({documents.filter((d) => d.category === 'underwriting').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('product')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'product'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Produk ({documents.filter((d) => d.category === 'product').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('claim_faq')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'claim_faq'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Klaim & FAQ ({documents.filter((d) => d.category === 'claim_faq').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('compliance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'compliance'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Kepatuhan & AML ({documents.filter((d) => d.category === 'compliance').length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                aria-label="Cari dokumen"
                placeholder="Cari judul, tag, atau isi dokumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Document Cards Grid */}
          {filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
              <span className="text-3xl mb-2 block">📚</span>
              <h3 className="text-sm font-bold text-slate-800">Tidak ada dokumen yang ditemukan</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau ganti filter kategori.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDocuments.map((doc) => {
                const catBadge = getCategoryBadge(doc.category);
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      {/* Top bar inside card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${catBadge.className}`}
                          >
                            {catBadge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {doc.chunkCount} Vektor Chunks
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {doc.id}
                        </span>
                      </div>

                      {/* Title & Summary */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                          {doc.summary}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {doc.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Metadata footer */}
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Status: <strong className="text-slate-700 capitalize">{doc.status}</strong></span>
                        <span>Update: {new Date(doc.updatedAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailDoc(doc)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
                        >
                          📖 Baca Lengkap
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(doc)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                        >
                          ✏️ Edit
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReindexDoc(doc)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
                        >
                          🔄 Re-index
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus dokumen ${doc.title}`}
                          onClick={() => handleDeleteDoc(doc.id, doc.title)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI UNDERWRITING COPILOT PLAYGROUND */}
      {activeTab === 'copilot' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Simulasi Inferensi RAG & Underwriting Copilot
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ketik pertanyaan untuk mensimulasikan pencarian semantic search dan generative response berbasis dokumen SOP asuransi aktif.
              </p>
            </div>

            {/* Quick Sample Prompts */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Contoh Pertanyaan Cepat:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setChatQuery(prompt);
                      handleRunCopilot(prompt);
                    }}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors text-left"
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Category Selection */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="w-full sm:w-56">
                <select
                  aria-label="Filter kategori RAG"
                  value={copilotCategory}
                  onChange={(e) => setCopilotCategory(e.target.value as CategoryFilterKey)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Kategori Knowledge</option>
                  <option value="underwriting">Underwriting & Medis</option>
                  <option value="product">Ketentuan Produk</option>
                  <option value="claim_faq">Panduan Klaim & FAQ</option>
                  <option value="compliance">Kepatuhan & AML</option>
                </select>
              </div>

              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Ketik pertanyaan underwriting atau regulasi polis..."
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRunCopilot();
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <button
                type="button"
                disabled={isLoadingChat || !chatQuery.trim()}
                onClick={() => handleRunCopilot()}
                className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoadingChat ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <span>Tanya AI Copilot</span>
                    <span>⚡</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Result Presentation */}
          {chatResult && (
            <div className="bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden animate-in fade-in duration-300">
              {/* Header Box */}
              <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200">
                      Jawaban AI Underwriting Copilot
                    </h3>
                    <span className="text-[11px] text-blue-300">
                      Didukung pipeline RAG Core API v1.2
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded bg-white/10 text-white text-[11px] font-mono">
                  ⚡ Latensi: {chatResult.latencyMs} ms
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Synthesized Answer */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                  {chatResult.answer}
                </div>

                {/* Retrieved Source Chunks */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>📌</span>
                    <span>Sumber Rujukan Dokumen (Retrieved Chunks & Citations):</span>
                  </h4>

                  <div className="space-y-3">
                    {chatResult.sources.map((src, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{src.title}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold uppercase">
                              {src.sourceType}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] line-clamp-2">
                            &quot;{src.excerpt}&quot;
                          </p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            Similarity Score
                          </span>
                          <span className="font-mono font-extrabold text-blue-600 text-xs">
                            {(src.score * 100).toFixed(0)}% Match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Query History */}
          {chatHistory.length > 0 && (
            <div className="p-5 bg-white rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Riwayat Pertanyaan Terbaru:
              </h4>
              <ul className="space-y-2 text-xs">
                {chatHistory.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      setChatQuery(item.query);
                      setChatResult(item.response);
                    }}
                  >
                    <span className="font-medium text-slate-800">💬 {item.query}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.response.latencyMs} ms
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Tambah / Edit Dokumen */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingDoc ? `Edit Dokumen: ${editingDoc.title}` : 'Tambah Dokumen Knowledge Base'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tambahkan panduan underwriting, SOP produk, atau dokumen regulasi baru ke pipeline RAG.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Dokumen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Pedoman Limit Uang Pertanggungan 2026"
                    value={formData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        title: newTitle,
                        slug: editingDoc
                          ? prev.slug
                          : newTitle
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, ''),
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slug Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="misal: pedoman-limit-uang-pertanggungan"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Dokumen</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value as KnowledgeCategory }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="underwriting">Underwriting & Medis</option>
                    <option value="product">Ketentuan Produk</option>
                    <option value="claim_faq">Panduan Klaim & FAQ</option>
                    <option value="compliance">Kepatuhan & AML</option>
                    <option value="company">Perusahaan & Kebijakan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tags (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    placeholder="underwriting, sop, limit"
                    value={formData.tagsText}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tagsText: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan Eksekutif (Excerpt) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ringkasan 1-2 kalimat untuk snippet sitasi"
                  value={formData.summary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konten Lengkap Dokumen (Markdown / Text) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Masukkan ketentuan detail SOP, pasal-pasal, atau tabel limit..."
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingDoc ? 'Simpan Perubahan 💾' : 'Indeks Dokumen ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Dokumen Lengkap */}
      {detailDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  ID: {detailDoc.id} • Slug: {detailDoc.slug}
                </span>
                <h3 className="text-base font-bold text-slate-900">{detailDoc.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                  Ringkasan Eksekutif
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">{detailDoc.summary}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Isi Dokumen
                </span>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-mono max-h-72 overflow-y-auto">
                  {detailDoc.content}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {detailDoc.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
