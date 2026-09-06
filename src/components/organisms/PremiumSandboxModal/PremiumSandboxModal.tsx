'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { InsuranceProduct } from '@/server/repositories/product.repository.interface';

export interface PremiumSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: InsuranceProduct[];
  initialProductId?: string;
}

export const PremiumSandboxModal: React.FC<PremiumSandboxModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products?.[0]?.id || ''
  );
  const [age, setAge] = useState(30);
  const [isSmoker, setIsSmoker] = useState(false);
  const [sumAssured, setSumAssured] = useState(1000000000);
  const [frequency, setFrequency] = useState<'annual' | 'monthly'>('annual');

  // Sync if initialProductId changes during render
  const [prevInitialId, setPrevInitialId] = useState(initialProductId);
  if (initialProductId && initialProductId !== prevInitialId) {
    setPrevInitialId(initialProductId);
    setSelectedProductId(initialProductId);
  }

  const activeProduct = useMemo(() => {
    if (!products || products.length === 0) return null;
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Actuarial Calculation Logic
  const calculation = useMemo(() => {
    const baseRate = activeProduct?.pricingRules?.baseRate || 0.0023; // 2.30 permil
    const ageFactors = activeProduct?.pricingRules?.ageFactors || [
      { minAge: 18, maxAge: 24, factor: 0.85 },
      { minAge: 25, maxAge: 35, factor: 1.0 },
      { minAge: 36, maxAge: 45, factor: 1.25 },
      { minAge: 46, maxAge: 55, factor: 1.6 },
      { minAge: 56, maxAge: 65, factor: 2.1 },
    ];

    const matchedAgeFactor =
      ageFactors.find((af) => age >= af.minAge && age <= af.maxAge)?.factor ||
      (age < 25 ? 0.85 : age > 55 ? 2.1 : 1.0);

    const activeSmokerPct = activeProduct?.pricingRules?.smokerFactors?.yes
      ? Math.round((activeProduct.pricingRules.smokerFactors.yes - 1) * 100)
      : 35;
    const smokerFactor = isSmoker ? (1 + activeSmokerPct / 100) : 1.0;
    const frequencyFactor = frequency === 'annual' ? 0.92 : 1.0;

    const baseAnnual = sumAssured * baseRate * matchedAgeFactor * smokerFactor;
    const annualPremium = Math.round(baseAnnual * frequencyFactor);
    const monthlyEquivalent = Math.round(annualPremium / 12);
    const monthlyUndiscounted = Math.round(baseAnnual / 12);
    const annualSavings = (monthlyUndiscounted * 12) - annualPremium;

    const isAutoApproved = age <= 50 && !isSmoker && sumAssured <= 1000000000;
    const medicalExamRequired = sumAssured > 1000000000 || age > 55;

    return {
      baseRate,
      matchedAgeFactor,
      smokerFactor,
      activeSmokerPct,
      frequencyFactor,
      annualPremium,
      monthlyEquivalent,
      annualSavings: annualSavings > 0 ? annualSavings : 240000,
      isAutoApproved,
      medicalExamRequired,
    };
  }, [activeProduct, age, isSmoker, sumAssured, frequency]);

  const jsonPreview = useMemo(() => {
    return JSON.stringify(
      {
        status: 'success',
        product_id: activeProduct?.id || '',
        premium: {
          annual: calculation.annualPremium,
          monthly_equivalent: calculation.monthlyEquivalent,
          discount_applied: frequency === 'annual' ? '8%' : '0%',
        },
        underwriting: {
          decision: calculation.isAutoApproved ? 'AUTO_APPROVE' : 'MANUAL_REVIEW_REQUIRED',
          medical_exam_required: calculation.medicalExamRequired,
          dsr_threshold_pct: 15.0,
        },
      },
      null,
      2
    );
  }, [activeProduct, calculation, frequency]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  if (!isOpen) return null;

  if (!activeProduct) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        badgeText="SANDBOX SIMULATOR"
        badgeVariant="blue"
        title="Katalog Produk Kosong"
      >
        <div className="py-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Produk Tersedia</h3>
            <p className="text-xs text-slate-500">
              Tidak ada data produk asuransi untuk disimulasikan di sandbox.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
          >
            Tutup Simulator
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      badgeText="TESTING SANDBOX • UNDERWRITING ENGINE"
      badgeVariant="indigo"
      title="Sandbox Simulator Kalkulasi Premi Aktuarial"
      subtitle="Uji langsung formula matematika kalkulasi premi Core API sebelum dirilis ke aplikasi nasabah."
      footer={
        <div className="flex items-center justify-end w-full">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
          >
            Tutup Simulator ✕
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
        {/* LEFT COLUMN: Parameter Masukan Simulasi */}
        <div className="space-y-3.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            PARAMETER MASUKAN SIMULASI
          </span>

          {/* Product Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Pilih Produk Yang Diuji:
            </label>
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              options={products.map((p) => ({
                value: p.id,
                label: `🛡️  ${p.name} (${p.id})`,
              }))}
            />
          </div>

          {/* Age Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Usia Tertanggung (Tahun):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="18"
                max="65"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
              <span className="text-[11px] text-slate-500 font-medium">
                {age} Tahun (Koefisien: {calculation.matchedAgeFactor.toFixed(2)}x Baseline Standard)
              </span>
            </div>
          </div>

          {/* Smoker Radio Cards */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-700">
              Kebiasaan Merokok:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsSmoker(false)}
                className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                  !isSmoker
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600">{!isSmoker ? '✓' : '○'}</span>
                  <span>Non-Perokok (1.00x)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsSmoker(true)}
                className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                  isSmoker
                    ? 'border-amber-500 bg-amber-50/70 text-amber-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-600">{isSmoker ? '✓' : '○'}</span>
                  <span>Perokok (+{calculation.activeSmokerPct}% Loading)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Sum Assured Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Pilihan Uang Pertanggungan (UP):
            </label>
            <Select
              value={String(sumAssured)}
              onChange={(e) => setSumAssured(Number(e.target.value))}
              options={[
                { value: '500000000', label: 'Rp 500.000.000 (Lima Ratus Juta Rupiah)' },
                { value: '1000000000', label: 'Rp 1.000.000.000 (Satu Miliar Rupiah)' },
                { value: '2000000000', label: 'Rp 2.000.000.000 (Dua Miliar Rupiah)' },
                { value: '3000000000', label: 'Rp 3.000.000.000 (Tiga Miliar Rupiah)' },
              ]}
            />
          </div>

          {/* Payment Frequency */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Frekuensi Pembayaran &amp; Tenor:
            </label>
            <Select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'annual' | 'monthly')}
              options={[
                { value: 'annual', label: 'Tahunan (Hemat 8% Diskon Autodebet)' },
                { value: 'monthly', label: 'Bulanan (Standar Tanpa Diskon)' },
              ]}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            Jalankan Uji Formula Aktuaria 🧪
          </Button>

          {/* API Response Preview */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              API RESPONSE PREVIEW: POST /api/v1/simulations/calculate
            </span>
            <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
              {jsonPreview}
            </pre>
          </div>
        </div>

        {/* RIGHT COLUMN: Hasil Perhitungan & Breakdown Formula */}
        <div className="space-y-3.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            HASIL PERHITUNGAN &amp; BREAKDOWN FORMULA
          </span>

          {/* Premium Highlight Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              PREMI HASIL KALKULASI ENGINE:
            </span>
            <div className="text-2xl font-black font-mono tracking-tight text-white">
              {formatRupiah(calculation.annualPremium)} / tahun
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Setara dengan <span className="text-emerald-400 font-bold">{formatRupiah(calculation.monthlyEquivalent)} / bulan</span>
              {frequency === 'annual' && ` (Hemat ${formatRupiah(calculation.annualSavings)} vs Bulanan)`}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                calculation.isAutoApproved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {calculation.isAutoApproved ? '✓ TIER: AUTOMATED APPROVAL' : '⚠️ TIER: MANUAL UNDERWRITING'}
              </span>
              <span className="text-[11px] text-slate-400">
                {calculation.medicalExamRequired ? 'Wajib MCU Laboratorium' : 'Lolos Otomatis Tanpa Rujuk Dokter'}
              </span>
            </div>
          </div>

          {/* Multiplier Factor Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              RINCIAN FAKTOR MULTIPLIER AKTUARIA:
            </span>
            <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200/80">
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Tarif Dasar Aktuaria (Base Rate)</div>
                  <div className="text-[11px] text-slate-500">Nilai indeks premi dasar per Rp 1.000 UP</div>
                </div>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {(calculation.baseRate * 1000).toFixed(2)} ‰
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Faktor Pengali Usia ({age} Tahun)</div>
                  <div className="text-[11px] text-slate-500">Tabel mortalitas aktuaria OJK</div>
                </div>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {calculation.matchedAgeFactor.toFixed(2)}x
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Faktor Kebiasaan Merokok</div>
                  <div className="text-[11px] text-slate-500">{isSmoker ? 'Perokok Aktif (+35%)' : 'Non-Smoker'}</div>
                </div>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {calculation.smokerFactor.toFixed(2)}x
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Diskon Frekuensi Tahunan</div>
                  <div className="text-[11px] text-slate-500">{frequency === 'annual' ? 'Hemat 8% autodebet (OJK Approved)' : 'Tidak ada diskon bulanan'}</div>
                </div>
                <span className="font-mono font-bold text-emerald-700 text-xs">
                  {calculation.frequencyFactor.toFixed(2)}x {frequency === 'annual' ? '(-8%)' : '(0%)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
