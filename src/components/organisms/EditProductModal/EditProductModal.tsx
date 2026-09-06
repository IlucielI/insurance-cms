'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { InsuranceProduct, ProductStatus } from '@/server/repositories/product.repository.interface';

export interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: InsuranceProduct | null;
  onSubmitEdit?: (updatedProduct: InsuranceProduct) => Promise<void> | void;
  onArchiveProduct?: (productId: string) => Promise<void> | void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSubmitEdit,
  onArchiveProduct,
}) => {
  const [name, setName] = useState(product?.name || 'Secure Life Plus');
  const [slug, setSlug] = useState(product?.slug || 'secure-life-plus');
  const [category, setCategory] = useState<'life' | 'health' | 'vehicle'>(
    product?.category || 'life'
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status || 'active'
  );
  const [basePremiumMonthly, setBasePremiumMonthly] = useState(
    product?.startingPremium || 250000
  );
  const [minSumAssured, setMinSumAssured] = useState(
    product?.minSumAssured || 100000000
  );
  const [maxSumAssured, setMaxSumAssured] = useState(
    product?.maxSumAssured || 2000000000
  );
  const getMinAge = (p?: InsuranceProduct | null) =>
    p?.pricingRules?.ageFactors?.[0]?.minAge || 18;

  const getMaxAge = (p?: InsuranceProduct | null) => {
    const factors = p?.pricingRules?.ageFactors;
    return factors && factors.length > 0
      ? factors[factors.length - 1]?.maxAge || 60
      : 60;
  };

  const [minAge, setMinAge] = useState(getMinAge(product));
  const [maxAge, setMaxAge] = useState(getMaxAge(product));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when product changes or modal re-opens
  const [prevProductId, setPrevProductId] = useState(product?.id);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen || (product && product.id !== prevProductId)) {
    setPrevIsOpen(isOpen);
    setPrevProductId(product?.id);
    if (isOpen && product) {
      setErrorMsg(null);
      setIsSubmitting(false);
      setIsArchiving(false);
      setName(product.name);
      setSlug(product.slug);
      setCategory(product.category);
      setStatus(product.status || 'active');
      setBasePremiumMonthly(product.startingPremium || 250000);
      setMinSumAssured(product.minSumAssured);
      setMaxSumAssured(product.maxSumAssured);
      setMinAge(getMinAge(product));
      setMaxAge(getMaxAge(product));
    }
  }

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama produk wajib diisi.');
      return;
    }
    if (minAge > maxAge) {
      setErrorMsg('Batas usia masuk minimum tidak boleh lebih besar dari usia maksimum.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      let updatedPricingRules = product.pricingRules;
      if (updatedPricingRules) {
        const factors = updatedPricingRules.ageFactors
          ? [...updatedPricingRules.ageFactors]
          : [];
        if (factors.length === 1) {
          factors[0] = { ...factors[0], minAge, maxAge };
        } else if (factors.length > 1) {
          factors[0] = { ...factors[0], minAge };
          if (factors[0].maxAge < minAge) {
            factors[0].maxAge = minAge;
          }
          factors[factors.length - 1] = {
            ...factors[factors.length - 1],
            maxAge,
          };
          if (factors[factors.length - 1].minAge > maxAge) {
            factors[factors.length - 1].minAge = maxAge;
          }
        } else {
          factors.push({ minAge, maxAge, factor: 1.0 });
        }
        updatedPricingRules = {
          ...updatedPricingRules,
          ageFactors: factors,
        };
      } else {
        updatedPricingRules = {
          baseRate: 0.0023,
          ageFactors: [{ minAge, maxAge, factor: 1.0 }],
          genderFactors: { male: 1.0, female: 0.95 },
          smokerFactors: { yes: 1.35, no: 1.0 },
          occupationFactors: { low: 1.0, standard: 1.2, high: 1.5 },
          healthFactors: { low: 1.0, medium: 1.3, high: 1.8 },
          frequencyLoading: {
            annual: 1.0,
            semiAnnual: 1.03,
            quarterly: 1.05,
            monthly: 1.08,
          },
        };
      }

      await onSubmitEdit?.({
        ...product,
        name,
        slug,
        category,
        status,
        startingPremium: basePremiumMonthly,
        minSumAssured,
        maxSumAssured,
        pricingRules: updatedPricingRules,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui konfigurasi produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function' &&
      !window.confirm(`Apakah Anda yakin ingin mengarsipkan produk ${product.name}? Vektor AI akan dinonaktifkan.`)
    ) {
      return;
    }
    setIsArchiving(true);
    try {
      await onArchiveProduct?.(product.id);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengarsipkan produk.');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      badgeText={`EDIT PRODUK • ID: ${product.id.toUpperCase()} (${status.toUpperCase()})`}
      badgeVariant={status === 'active' ? 'emerald' : 'slate'}
      title={`Edit Produk: ${name}`}
      subtitle="Kelola data produk aktuarial dan pantau status keterkinian vektor pada pgvector Core AI."
      footer={
        <div className="w-full space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleArchive}
              disabled={isSubmitting || isArchiving}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
            >
              {isArchiving ? 'Mengarsipkan...' : 'Arsipkan (Hapus dari AI Index) 🗑️'}
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                disabled={isSubmitting || isArchiving}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!name.trim() || isSubmitting || isArchiving}
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                {isSubmitting ? 'Menyimpan...' : 'Perbarui & Re-Index Vector DB 🔄'}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            Perubahan tercatat di System Audit Trail • Terintegrasi PostgreSQL pgvector.
          </p>
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
                Nama Produk:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Slug URL API:
              </label>
              <input
                type="text"
                value={slug}
                readOnly
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Kategori:
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'life' | 'health' | 'vehicle')}
                options={[
                  { value: 'life', label: 'life (Asuransi Jiwa)' },
                  { value: 'health', label: 'health (Asuransi Kesehatan)' },
                  { value: 'vehicle', label: 'vehicle (Asuransi Kendaraan)' },
                ]}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Status:
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                options={[
                  { value: 'active', label: '🟢 ACTIVE (Tersedia di Pasar)' },
                  { value: 'draft', label: '⚪ DRAFT (Non-aktif / Uji Coba)' },
                  { value: 'archived', label: '🔴 ARCHIVED (Diarsipkan)' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Parameter Tarif & Limit UP */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. PARAMETER TARIF &amp; LIMIT UP
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
              <input
                type="number"
                min="10000000"
                step="50000000"
                value={maxSumAssured}
                onChange={(e) => setMaxSumAssured(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Batas Usia Masuk (Min - Maks):
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
                  aria-label="Usia Masuk Min"
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
                  aria-label="Usia Masuk Maks"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Status Vector DB */}
        <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <span>🧠</span>
              <span>STATUS VECTOR DB: TERINDEKS AKTIF</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
              pgvector Synced
            </span>
          </div>

          <div className="text-[11px] text-slate-600">
            Versi Embedding: <span className="font-bold text-slate-800">v2.4 (Hash: #88fa2c)</span> • Terakhir Disinkronkan: <span className="font-bold text-slate-800">05 Sep 2026, 14:20 WIB</span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Produk ini telah dirujuk dalam <span className="font-bold text-indigo-900">1.420 sesi konsultasi AI customer</span> (06 Tanya AI) dengan akurasi retrieval <span className="font-bold text-indigo-900">98.4%</span>.
          </p>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg space-y-1">
            <span className="font-bold text-amber-900 text-[11px] block">
              ⚠️ PERINGATAN RE-INDEXING OTOMATIS:
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Setiap pengubahan pada tarif premi, rentang UP, atau syarat usia akan secara otomatis meng-update embedding di pgvector dan me-refresh seluruh cache RAG chatbot dalam &lt; 500ms.
            </p>
            <p className="text-[10px] text-amber-800 font-semibold pt-0.5">
              Jika Anda mengarsipkan produk, vektor produk ini langsung di-nonaktifkan dari hasil rekomendasi AI.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
};
