'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';

export interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSlugs?: string[];
  initialData?: {
    name?: string;
    slug?: string;
    category?: 'life' | 'health' | 'vehicle';
    status?: 'ACTIVE' | 'INACTIVE';
    basePremiumMonthly?: number;
    minSumAssured?: number;
    maxSumAssured?: number;
    minAge?: number;
    maxAge?: number;
    summary?: string;
  } | null;
  onSubmitCreate?: (data: {
    name: string;
    slug: string;
    category: 'life' | 'health' | 'vehicle';
    status: 'ACTIVE' | 'INACTIVE';
    basePremiumMonthly: number;
    minSumAssured: number;
    maxSumAssured: number;
    minAge: number;
    maxAge: number;
    summary: string;
  }) => Promise<void> | void;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  existingSlugs = [],
  initialData,
  onSubmitCreate,
}) => {
  const [name, setName] = useState('Perlindungan Jiwa Syariah Murni');
  const [slug, setSlug] = useState('life-syariah-murni');
  const [category, setCategory] = useState<'life' | 'health' | 'vehicle'>('life');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [basePremiumMonthly, setBasePremiumMonthly] = useState(200000);
  const [minSumAssured, setMinSumAssured] = useState(100000000);
  const [maxSumAssured, setMaxSumAssured] = useState(3000000000);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(60);
  const [summary, setSummary] = useState(
    'Santunan Meninggal Dunia 100% UP. Bebas Medical Exam (MCU) untuk UP hingga Rp 1 Miliar. Garansi SLA pencairan klaim 3 hari kerja ke rekening ahli waris setelah verifikasi berkas.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize state when modal opens or initialData changes
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setSlug(initialData.slug || '');
        setCategory(initialData.category || 'life');
        setStatus(initialData.status || 'ACTIVE');
        setBasePremiumMonthly(initialData.basePremiumMonthly ?? 200000);
        setMinSumAssured(initialData.minSumAssured ?? 100000000);
        setMaxSumAssured(initialData.maxSumAssured ?? 3000000000);
        setMinAge(initialData.minAge ?? 18);
        setMaxAge(initialData.maxAge ?? 60);
        setSummary(
          initialData.summary ||
            'Santunan Meninggal Dunia 100% UP. Bebas Medical Exam (MCU) untuk UP hingga Rp 1 Miliar. Garansi SLA pencairan klaim 3 hari kerja ke rekening ahli waris setelah verifikasi berkas.'
        );
      }
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }

  const isSlugDuplicate = Boolean(
    slug.trim() && existingSlugs.some((s) => s.toLowerCase() === slug.trim().toLowerCase())
  );

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(autoSlug);
    if (existingSlugs.some((s) => s.toLowerCase() === autoSlug)) {
      setErrorMsg(`Produk dengan slug "${autoSlug}" sudah terdaftar di sistem.`);
    } else {
      setErrorMsg(null);
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val);
    if (existingSlugs.some((s) => s.toLowerCase() === val.trim().toLowerCase())) {
      setErrorMsg(`Produk dengan slug "${val.trim()}" sudah terdaftar di sistem.`);
    } else {
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama produk wajib diisi.');
      return;
    }
    if (!slug.trim()) {
      setErrorMsg('Slug URL API wajib diisi.');
      return;
    }
    if (isSlugDuplicate) {
      setErrorMsg(`Produk dengan slug "${slug.trim()}" sudah terdaftar di sistem. Silakan gunakan slug lain.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmitCreate?.({
        name,
        slug,
        category,
        status,
        basePremiumMonthly,
        minSumAssured,
        maxSumAssured,
        minAge,
        maxAge,
        summary,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menambahkan produk baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const chunkPreview = `[PRODUK: ${name || 'N/A'}] [KATEGORI: ${category}] [SLUG: ${slug || 'n/a'}] [BASE_PREMIUM: ${basePremiumMonthly}] [UP_MAX: ${maxSumAssured}] [KLAUSUL: ${summary.slice(0, 100)}...]`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      badgeText="TAMBAH PRODUK BARU • CORE API"
      badgeVariant="blue"
      title="Definisi Produk & Parameter Underwriting"
      subtitle="Konfigurasi batasan tarif, parameter underwriting, dan sinkronisasi otomatis ke Vector DB AI."
      footer={
        <div className="w-full space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-[11px] text-slate-500 font-medium">
              🔒 Perubahan divalidasi oleh Core API &amp; tersimpan dalam log audit ISO 27001.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!name.trim() || !slug.trim() || isSubmitting || isSlugDuplicate}
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Sinkronkan ke Vector DB 🚀'}
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Section 1: Informasi Dasar Produk */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. INFORMASI DASAR PRODUK
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Nama Resmi Produk Asuransi:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="misal: Perlindungan Jiwa Syariah Murni"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Slug URL API (Auto-generated):
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="misal: life-syariah-murni"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 ${
                  isSlugDuplicate
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {isSlugDuplicate && (
                <p className="text-[10px] text-rose-600 font-medium">
                  ⚠️ Slug ini sudah digunakan. Ubah slug agar unik.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Kategori Polis Asuransi:
              </label>
              <Select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as 'life' | 'health' | 'vehicle';
                  setCategory(newCat);
                  if (newCat === 'vehicle') {
                    if (minAge === 18 && maxAge === 60) {
                      setMinAge(0);
                      setMaxAge(15);
                    }
                  } else {
                    if (minAge === 0 && maxAge === 15) {
                      setMinAge(18);
                      setMaxAge(60);
                    }
                  }
                }}
                options={[
                  { value: 'life', label: 'Asuransi Jiwa & Keluarga (life)' },
                  { value: 'health', label: 'Asuransi Kesehatan (health)' },
                  { value: 'vehicle', label: 'Asuransi Kendaraan Bermotor (vehicle)' },
                ]}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Status Publikasi:
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                options={[
                  { value: 'ACTIVE', label: '🟢 ACTIVE (Langsung Tersedia di Aplikasi)' },
                  { value: 'INACTIVE', label: '⚪ INACTIVE (Draft / Non-aktif)' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Parameter Tarif & Underwriting Otomatis */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. PARAMETER TARIF &amp; UNDERWRITING OTOMATIS
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Premi Dasar Bulanan:
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={basePremiumMonthly}
                onChange={(e) => setBasePremiumMonthly(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Rentang Uang Pertanggungan (UP):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10000000"
                  step="10000000"
                  value={minSumAssured}
                  onChange={(e) => setMinSumAssured(Number(e.target.value))}
                  className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                  placeholder="Min UP"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  min="10000000"
                  step="50000000"
                  value={maxSumAssured}
                  onChange={(e) => setMaxSumAssured(Number(e.target.value))}
                  className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                  placeholder="Maks UP"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                {category === 'vehicle' ? 'Batas Usia Kendaraan (Min - Maks Tahun):' : 'Batas Usia Masuk (Min - Maks):'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                  placeholder="Min"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                  placeholder="Maks"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Ringkasan Manfaat & Klausul Polis */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. RINGKASAN MANFAAT &amp; KLAUSUL POLIS
          </label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Section 4: Otomatisasi Vector DB (pgvector & RAG AI) */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-blue-950">
              <span>⚡</span>
              <span>OTOMATISASI VECTOR DB (PGVECTOR &amp; RAG AI)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
              AUTO-SYNC ON
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Sistem akan secara otomatis mengekstrak parameter produk, menghasilkan representasi teks terstruktur, dan meng-upsert embedding vektor 1536-dimensi ke pgvector.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1 border-y border-blue-200/60 font-semibold text-[11px] text-blue-900">
            <div>Namespace: <span className="font-mono text-slate-800">products_master_v1</span></div>
            <div>Embedding: <span className="font-mono text-slate-800">text-embedding-3-small</span></div>
            <div>Dimensi: <span className="font-mono text-slate-800">1536 (~380 Tokens)</span></div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              PREVIEW STRUCTURED CHUNK DATA YANG DI-INDEX:
            </span>
            <div className="p-2.5 rounded-lg bg-white border border-blue-200 font-mono text-[11px] text-slate-800 break-all leading-relaxed">
              {chunkPreview}
            </div>
          </div>

          <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
            <span>✓</span>
            <span>Otomatis memperbarui index pgvector dan invalidate cache AI Chatbot saat disimpan.</span>
          </div>
        </div>
      </form>
    </Modal>
  );
};
