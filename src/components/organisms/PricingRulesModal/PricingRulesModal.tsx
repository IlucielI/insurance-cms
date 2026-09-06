'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { InsuranceProduct } from '@/server/repositories/product.repository.interface';

export interface PricingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: InsuranceProduct | null;
  onOpenSandbox?: (productId: string) => void;
  onSavePricingRules?: (product: InsuranceProduct) => Promise<void> | void;
}

export const PricingRulesModal: React.FC<PricingRulesModalProps> = ({
  isOpen,
  onClose,
  product,
  onOpenSandbox,
  onSavePricingRules,
}) => {
  const getInitialBaseRate = (p?: InsuranceProduct | null) =>
    p?.pricingRules?.baseRate ? p.pricingRules.baseRate * 1000 : 2.3;

  const getInitialSmokerPct = (p?: InsuranceProduct | null) =>
    p?.pricingRules?.smokerFactors?.yes
      ? Math.round((p.pricingRules.smokerFactors.yes - 1) * 100)
      : 35;

  const getInitialAnnualDiscount = (p?: InsuranceProduct | null) =>
    p?.pricingRules?.annualDiscountPct ?? 8.0;

  const getInitialNonMcuLimit = (p?: InsuranceProduct | null) =>
    p?.pricingRules?.nonMcuLimit ?? 1000000000;

  const [baseRatePermil, setBaseRatePermil] = useState(getInitialBaseRate(product));
  const [annualDiscountPct, setAnnualDiscountPct] = useState(
    getInitialAnnualDiscount(product)
  );
  const [minTenorYears, setMinTenorYears] = useState(product?.minPaymentTerm || 10);
  const [smokerLoadingPct, setSmokerLoadingPct] = useState(
    getInitialSmokerPct(product)
  );
  const [nonMcuLimit, setNonMcuLimit] = useState(getInitialNonMcuLimit(product));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if product changes or modal re-opens
  const [prevProductId, setPrevProductId] = useState(product?.id);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen || (product && product.id !== prevProductId)) {
    setPrevIsOpen(isOpen);
    setPrevProductId(product?.id);
    if (isOpen && product) {
      setErrorMsg(null);
      setIsSubmitting(false);
      setBaseRatePermil(getInitialBaseRate(product));
      setSmokerLoadingPct(getInitialSmokerPct(product));
      setAnnualDiscountPct(getInitialAnnualDiscount(product));
      setMinTenorYears(product.minPaymentTerm || 10);
      setNonMcuLimit(getInitialNonMcuLimit(product));
    }
  }

  if (!product) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const updatedRules = {
        ...product.pricingRules,
        baseRate: baseRatePermil / 1000,
        smokerFactors: {
          yes: 1 + smokerLoadingPct / 100,
          no: 1.0,
        },
        annualDiscountPct,
        nonMcuLimit,
      };
      await onSavePricingRules?.({
        ...product,
        pricingRules: updatedRules,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan aturan pricing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestSandbox = () => {
    onOpenSandbox?.(product.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      badgeText={`PRICING & UNDERWRITING ENGINE • ${product.id.toUpperCase()}`}
      badgeVariant="indigo"
      title={`Konfigurasi Pricing Rules: ${product.name}`}
      subtitle="Pengaturan formula aktuaria, koefisien risiko usia, smoker loading, dan batas persetujuan otomatis OJK."
      footer={
        <div className="w-full space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-[11px] text-slate-500 font-medium">
              Validasi regulasi POJK No. 23/POJK.05/2015 terpenuhi • Sistem siap produksi.
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
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
                variant="outline"
                size="md"
                onClick={handleTestSandbox}
                disabled={isSubmitting}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                Uji di Sandbox 🧪
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Aturan Tarif & Deploy ke Core API 🚀'}
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Section 1: Tarif Dasar (Base Rate) & Diskon Cara Bayar */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. TARIF DASAR (BASE RATE) &amp; DISKON CARA BAYAR
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Tarif Dasar per Rp 1.000 UP:
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={baseRatePermil}
                onChange={(e) => setBaseRatePermil(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Rp {baseRatePermil.toFixed(2)} / 1.000 UP ({baseRatePermil.toFixed(2)} ‰)</span>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Diskon Frekuensi Tahunan (OJK):
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={annualDiscountPct}
                onChange={(e) => setAnnualDiscountPct(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                aria-label="Diskon Frekuensi Tahunan"
              />
              <span className="text-[10px] text-slate-400">{annualDiscountPct.toFixed(1)}% (Faktor: {(1 - annualDiscountPct / 100).toFixed(2)}x)</span>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Masa Tenor Minimum Polis:
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={minTenorYears}
                onChange={(e) => setMinTenorYears(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400">{minTenorYears} Tahun (Dapat Diperpanjang)</span>
            </div>
          </div>
        </div>

        {/* Section 2: Tabel Koefisien Multiplier Usia Masuk */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. TABEL KOEFISIEN MULTIPLIER USIA MASUK (MORTALITY CURVE)
          </span>
          <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200/80">
            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 text-xs w-36">Usia 18 - 24 Tahun</span>
                <span className="font-mono font-bold text-emerald-700 text-xs">0.85x</span>
                <span className="text-[11px] text-slate-500">Diskon Usia Muda (-15% dari baseline)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Low Risk
              </span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 text-xs w-36">Usia 25 - 35 Tahun</span>
                <span className="font-mono font-bold text-blue-700 text-xs">1.00x</span>
                <span className="text-[11px] text-slate-500">Baseline Standar Aktuarial (Indeks Pokok 1.00)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                Baseline
              </span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 text-xs w-36">Usia 36 - 45 Tahun</span>
                <span className="font-mono font-bold text-amber-700 text-xs">1.25x</span>
                <span className="text-[11px] text-slate-500">Moderate Risk (+25% loading mortalitas)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Moderate
              </span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 text-xs w-36">Usia 46 - 55 Tahun</span>
                <span className="font-mono font-bold text-orange-700 text-xs">1.60x</span>
                <span className="text-[11px] text-slate-500">Elevated Risk (+60% loading mortalitas)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                Elevated
              </span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 text-xs w-36">Usia 56 - 65 Tahun</span>
                <span className="font-mono font-bold text-rose-700 text-xs">2.10x</span>
                <span className="text-[11px] text-slate-500">High Risk (+110% loading mortalitas)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                High Risk
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Gaya Hidup & Pintu Underwriting Medis */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. GAYA HIDUP &amp; PINTU UNDERWRITING MEDIS (OJK COMPLIANCE)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <span>🚬</span>
                  <span>Koefisien Tambahan Perokok (Smoker Loading):</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  ({(1 + smokerLoadingPct / 100).toFixed(2)}x)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={smokerLoadingPct}
                  onChange={(e) => setSmokerLoadingPct(Number(e.target.value))}
                  className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                />
                <span className="text-xs font-bold text-slate-700">%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Berlaku bagi perokok aktif atau pengguna rokok elektrik (vape) dalam 12 bulan terakhir.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <span>🏥</span>
                <span>Batas Maksimal Bebas Tes Medis (Non-MCU Limit):</span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="100000000"
                  max="5000000000"
                  step="100000000"
                  value={nonMcuLimit}
                  onChange={(e) => setNonMcuLimit(Number(e.target.value))}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  aria-label="Batas Maksimal Bebas Tes Medis"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Pengajuan UP di atas batas ini wajib melampirkan hasil laboratorium darah &amp; EKG.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Sinkronisasi Aktif Core API & pgvector */}
        <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2 text-xs text-slate-700">
          <div className="font-bold text-indigo-950 flex items-center gap-1.5">
            <span>⚡</span>
            <span>SINKRONISASI AKTIF: CORE API &amp; VECTOR DB PGVECTOR</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="font-semibold text-slate-800">Dampak Penerapan Perubahan Pricing Rules:</div>
            <p>1. <strong>Frontend Customer Langsung Ter-Update:</strong> Kalkulator 03 Simulasi &amp; 04 Pendaftaran otomatis menggunakan koefisien terbaru saat nasabah mengisi form.</p>
            <p>2. <strong>Invalidate Cache &amp; Update Embedding RAG AI:</strong> Representasi numerik pada pgvector di-refresh, sehingga 06 Tanya AI menjawab estimasi premi dengan tepat.</p>
            <p>3. <strong>Audit Log ISO 27001:</strong> Setiap pergantian tarif direkam lengkap dengan timestamp dan NIP aktuaris pengubah.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
