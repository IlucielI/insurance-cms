'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import {
  InsuranceProduct,
  AgeFactor,
  PricingRules,
} from '@/server/repositories/product.repository.interface';

export interface PricingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: InsuranceProduct | null;
  onOpenSandbox?: (productId: string) => void;
  onSavePricingRules?: (product: InsuranceProduct) => Promise<void> | void;
}

const DEFAULT_AGE_FACTORS: AgeFactor[] = [
  { minAge: 18, maxAge: 30, factor: 1.0 },
  { minAge: 31, maxAge: 40, factor: 1.25 },
  { minAge: 41, maxAge: 50, factor: 1.75 },
  { minAge: 51, maxAge: 60, factor: 2.5 },
];

export const PricingRulesModal: React.FC<PricingRulesModalProps> = ({
  isOpen,
  onClose,
  product,
  onOpenSandbox,
  onSavePricingRules,
}) => {
  const getInitialBaseRate = (p?: InsuranceProduct | null) =>
    p?.pricingRules?.baseRate ? Number((p.pricingRules.baseRate * 1000).toFixed(2)) : 3.5;

  const getInitialAnnualDiscount = (p?: InsuranceProduct | null) =>
    p?.pricingRules?.annualDiscountPct ?? 8.0;

  const getInitialNonMcuLimit = (p?: InsuranceProduct | null) =>
    p?.pricingRules?.nonMcuLimit ?? 1000000000;

  const getInitialAgeFactors = (p?: InsuranceProduct | null): AgeFactor[] => {
    if (p?.pricingRules?.ageFactors && p.pricingRules.ageFactors.length > 0) {
      return p.pricingRules.ageFactors.map((af) => ({ ...af }));
    }
    return DEFAULT_AGE_FACTORS.map((af) => ({ ...af }));
  };

  // Section 1: Base Rate, Tenor, Discount, Non-MCU Limit
  const [baseRatePermil, setBaseRatePermil] = useState(getInitialBaseRate(product));
  const [annualDiscountPct, setAnnualDiscountPct] = useState(getInitialAnnualDiscount(product));
  const [minTenorYears, setMinTenorYears] = useState(product?.minPaymentTerm || 10);
  const [nonMcuLimit, setNonMcuLimit] = useState(getInitialNonMcuLimit(product));

  // Section 2: Dynamic Age Brackets
  const [ageFactors, setAgeFactors] = useState<AgeFactor[]>(getInitialAgeFactors(product));

  // Section 3: Multipliers Map
  const [genderMale, setGenderMale] = useState(product?.pricingRules?.genderFactors?.male ?? 1.05);
  const [genderFemale, setGenderFemale] = useState(product?.pricingRules?.genderFactors?.female ?? 1.0);
  const [smokerYes, setSmokerYes] = useState(product?.pricingRules?.smokerFactors?.yes ?? 1.35);
  const [smokerNo, setSmokerNo] = useState(product?.pricingRules?.smokerFactors?.no ?? 1.0);

  const [occLow, setOccLow] = useState(product?.pricingRules?.occupationFactors?.low ?? 0.95);
  const [occStandard, setOccStandard] = useState(product?.pricingRules?.occupationFactors?.standard ?? 1.0);
  const [occHigh, setOccHigh] = useState(product?.pricingRules?.occupationFactors?.high ?? 1.4);

  const [freqAnnual, setFreqAnnual] = useState(product?.pricingRules?.frequencyLoading?.annual ?? 1.0);
  const [freqSemiAnnual, setFreqSemiAnnual] = useState(product?.pricingRules?.frequencyLoading?.semiAnnual ?? 1.02);
  const [freqQuarterly, setFreqQuarterly] = useState(product?.pricingRules?.frequencyLoading?.quarterly ?? 1.035);
  const [freqMonthly, setFreqMonthly] = useState(product?.pricingRules?.frequencyLoading?.monthly ?? 1.06);

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
      setAnnualDiscountPct(getInitialAnnualDiscount(product));
      setMinTenorYears(product.minPaymentTerm || 10);
      setNonMcuLimit(getInitialNonMcuLimit(product));
      setAgeFactors(getInitialAgeFactors(product));

      setGenderMale(product.pricingRules?.genderFactors?.male ?? 1.05);
      setGenderFemale(product.pricingRules?.genderFactors?.female ?? 1.0);
      setSmokerYes(product.pricingRules?.smokerFactors?.yes ?? 1.35);
      setSmokerNo(product.pricingRules?.smokerFactors?.no ?? 1.0);

      setOccLow(product.pricingRules?.occupationFactors?.low ?? 0.95);
      setOccStandard(product.pricingRules?.occupationFactors?.standard ?? 1.0);
      setOccHigh(product.pricingRules?.occupationFactors?.high ?? 1.4);

      setFreqAnnual(product.pricingRules?.frequencyLoading?.annual ?? 1.0);
      setFreqSemiAnnual(product.pricingRules?.frequencyLoading?.semiAnnual ?? 1.02);
      setFreqQuarterly(product.pricingRules?.frequencyLoading?.quarterly ?? 1.035);
      setFreqMonthly(product.pricingRules?.frequencyLoading?.monthly ?? 1.06);
    }
  }

  if (!product) return null;

  const isVehicle =
    product.category === 'vehicle' ||
    (product as { categoryKey?: string })?.categoryKey === 'vehicle' ||
    product.slug?.toLowerCase().includes('auto') ||
    product.slug?.toLowerCase().includes('vehicle');

  // Bracket Handlers
  const handleUpdateBracket = (index: number, field: keyof AgeFactor, value: number) => {
    setAgeFactors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddBracket = () => {
    setAgeFactors((prev) => {
      const last = prev[prev.length - 1];
      const nextMin = last ? last.maxAge + 1 : 18;
      const nextMax = nextMin + 9;
      const nextFactor = last ? Number((last.factor + 0.25).toFixed(2)) : 1.0;
      return [...prev, { minAge: nextMin, maxAge: nextMax, factor: nextFactor }];
    });
  };

  const handleRemoveBracket = (index: number) => {
    if (ageFactors.length <= 1) return;
    setAgeFactors((prev) => prev.filter((_, i) => i !== index));
  };

  const getRiskBadge = (factor: number) => {
    if (factor <= 1.0) {
      return { label: 'Baseline', className: 'bg-blue-100 text-blue-800' };
    }
    if (factor <= 1.3) {
      return { label: 'Moderate', className: 'bg-amber-100 text-amber-800' };
    }
    if (factor <= 1.8) {
      return { label: 'Elevated', className: 'bg-orange-100 text-orange-800' };
    }
    return { label: 'High Risk', className: 'bg-rose-100 text-rose-800' };
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    // 1. Validasi Angka Dasar
    if (isNaN(baseRatePermil) || baseRatePermil <= 0) {
      setErrorMsg('Tarif dasar harus bernilai angka positif lebih besar dari 0.');
      setIsSubmitting(false);
      return;
    }
    if (isNaN(annualDiscountPct) || annualDiscountPct < 0 || annualDiscountPct > 100) {
      setErrorMsg('Diskon tahunan harus bernilai antara 0% hingga 100%.');
      setIsSubmitting(false);
      return;
    }
    if (isNaN(minTenorYears) || minTenorYears < 1) {
      setErrorMsg('Masa tenor minimum harus minimal 1 tahun.');
      setIsSubmitting(false);
      return;
    }
    if (isNaN(nonMcuLimit) || nonMcuLimit <= 0) {
      setErrorMsg('Batas bebas MCU harus bernilai angka positif lebih besar dari 0.');
      setIsSubmitting(false);
      return;
    }

    // 2. Validasi Dynamic Age Brackets
    for (let i = 0; i < ageFactors.length; i++) {
      const b = ageFactors[i];
      if (isNaN(b.minAge) || isNaN(b.maxAge) || isNaN(b.factor)) {
        setErrorMsg(`Rentang usia baris ke-${i + 1} tidak valid.`);
        setIsSubmitting(false);
        return;
      }
      if (b.minAge >= b.maxAge) {
        setErrorMsg(`Rentang usia baris ke-${i + 1} tidak valid: usia minimum (${b.minAge}) harus lebih kecil dari usia maksimum (${b.maxAge}).`);
        setIsSubmitting(false);
        return;
      }
      if (b.factor <= 0) {
        setErrorMsg(`Koefisien multiplier usia baris ke-${i + 1} harus lebih besar dari 0.`);
        setIsSubmitting(false);
        return;
      }
    }

    // 3. Validasi Multipliers Demografi & Loading
    const factors = [
      { name: 'Gender Pria', val: genderMale },
      { name: 'Gender Wanita', val: genderFemale },
      { name: 'Perokok Aktif', val: smokerYes },
      { name: 'Bebas Rokok', val: smokerNo },
      { name: 'Pekerjaan Risiko Rendah', val: occLow },
      { name: 'Pekerjaan Risiko Standar', val: occStandard },
      { name: 'Pekerjaan Risiko Tinggi', val: occHigh },
      { name: 'Frekuensi Tahunan', val: freqAnnual },
      { name: 'Frekuensi Semesteran', val: freqSemiAnnual },
      { name: 'Frekuensi Kuartalan', val: freqQuarterly },
      { name: 'Frekuensi Bulanan', val: freqMonthly },
    ];
    for (const f of factors) {
      if (isNaN(f.val) || f.val <= 0) {
        setErrorMsg(`Faktor ${f.name} harus berupa angka positif lebih besar dari 0.`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const updatedRules: PricingRules = {
        ...product.pricingRules,
        baseRate: baseRatePermil / 1000,
        ageFactors,
        genderFactors: {
          male: genderMale,
          female: genderFemale,
        },
        smokerFactors: {
          yes: smokerYes,
          no: smokerNo,
        },
        occupationFactors: {
          low: occLow,
          standard: occStandard,
          high: occHigh,
        },
        healthFactors: product.pricingRules?.healthFactors || {
          low: 1.0,
          medium: 1.25,
          high: 1.75,
        },
        frequencyLoading: {
          annual: freqAnnual,
          semiAnnual: freqSemiAnnual,
          quarterly: freqQuarterly,
          monthly: freqMonthly,
        },
        annualDiscountPct,
        nonMcuLimit,
      };

      await onSavePricingRules?.({
        ...product,
        minPaymentTerm: minTenorYears,
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
      badgeText={`DYNAMIC PRICING RULES ENGINE • ${product.id.toUpperCase()}`}
      badgeVariant="indigo"
      title={`Konfigurasi Pricing Rules: ${product.name}`}
      subtitle="Ditenagai tabel PostgreSQL `product_pricing_rules` • Evaluasi dinamis base rate, age brackets, multiplier map, & frequency loading."
      footer={
        <div className="w-full space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-[11px] text-slate-500 font-medium">
              Validasi regulasi POJK No. 23/POJK.05/2015 terpenuhi • Skema database `product_pricing_rules`
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
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 cursor-pointer"
              >
                Uji di Sandbox 🧪
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Aturan Tarif & Deploy ke Core API 🚀'}
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Section 1: Tarif Dasar (Base Rate), Tenor & Limit Non-MCU */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-800">
            1. TARIF DASAR (BASE RATE), TENOR &amp; LIMIT NON-MCU
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Tarif Dasar per Rp 1.000 UP:
              </label>
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={baseRatePermil}
                onChange={(e) => setBaseRatePermil(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                aria-label="Tarif Dasar per Rp 1.000 UP"
              />
              <span className="text-[10px] text-slate-500">
                Rp {baseRatePermil.toFixed(2)} ‰ (rate: {(baseRatePermil / 1000).toFixed(4)})
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Diskon Frekuensi Tahunan:
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={annualDiscountPct}
                onChange={(e) => setAnnualDiscountPct(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                aria-label="Diskon Frekuensi Tahunan"
              />
              <span className="text-[10px] text-slate-500">
                {annualDiscountPct.toFixed(1)}% (Faktor: {(1 - annualDiscountPct / 100).toFixed(2)}x)
              </span>
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                aria-label="Masa Tenor Minimum Polis"
              />
              <span className="text-[10px] text-slate-500">{minTenorYears} Tahun (Dapat Diperpanjang)</span>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Batas Bebas MCU (Non-MCU Limit):
              </label>
              <input
                type="number"
                min="100000000"
                max="10000000000"
                step="50000000"
                value={nonMcuLimit}
                onChange={(e) => setNonMcuLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                aria-label="Batas Maksimal Bebas Tes Medis"
              />
              <span className="text-[10px] text-slate-500">
                Rp {nonMcuLimit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Dynamic Age Brackets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              2. TABEL KOEFISIEN MULTIPLIER USIA MASUK (DYNAMIC BRACKETS)
            </span>
            <button
              type="button"
              onClick={handleAddBracket}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              + Tambah Rentang Usia
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200/80 overflow-hidden">
            {ageFactors.map((af, idx) => {
              const badge = getRiskBadge(af.factor);
              return (
                <div key={idx} className="p-2.5 flex flex-wrap items-center justify-between gap-2 bg-white/70">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Usia:</span>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={af.minAge}
                      onChange={(e) => handleUpdateBracket(idx, 'minAge', Number(e.target.value))}
                      className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label={`Usia Minimum Bracket ${idx + 1}`}
                    />
                    <span className="text-xs text-slate-400">-</span>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={af.maxAge}
                      onChange={(e) => handleUpdateBracket(idx, 'maxAge', Number(e.target.value))}
                      className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label={`Usia Maksimum Bracket ${idx + 1}`}
                    />
                    <span className="text-xs text-slate-500">Tahun</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-600">Multiplier:</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="5.0"
                        value={af.factor}
                        onChange={(e) => handleUpdateBracket(idx, 'factor', Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-indigo-300 rounded text-center text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        aria-label={`Koefisien Faktor Bracket ${idx + 1}`}
                      />
                      <span className="text-xs font-mono text-slate-500">x</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.className}`}>
                      {badge.label}
                    </span>

                    {ageFactors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBracket(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer text-xs p-1"
                        aria-label={`Hapus Bracket ${idx + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Matriks Multipliers Demografi, Gaya Hidup & Pekerjaan */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-800">
            3. MATRIKS PENGALI DEMOGRAFI, GAYA HIDUP &amp; PEKERJAAN (`rule_type: multiplier_map`)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Gender Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <span>⚧</span>
                <span>Faktor Jenis Kelamin:</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">Pria:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={genderMale}
                      onChange={(e) => setGenderMale(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label="Faktor Jenis Kelamin Pria"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">Wanita:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={genderFemale}
                      onChange={(e) => setGenderFemale(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label="Faktor Jenis Kelamin Wanita"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
              </div>
              <span className="block text-[10px] text-slate-400">Aturan Aktuaria Tabel TM4</span>
            </div>

            {/* Smoker Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <span>🚬</span>
                <span>Faktor Status Merokok:</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">Perokok:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={smokerYes}
                      onChange={(e) => setSmokerYes(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-rose-300 rounded text-center text-xs font-mono font-bold text-rose-700"
                      aria-label="Faktor Perokok Aktif"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">Bebas Rokok:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={smokerNo}
                      onChange={(e) => setSmokerNo(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label="Faktor Bebas Rokok"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
              </div>
              <span className="block text-[10px] text-slate-400">Loading +{Math.round((smokerYes - 1) * 100)}% perokok aktif</span>
            </div>

            {/* Occupation / Vehicle Usage Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <span>{isVehicle ? '🚗' : '💼'}</span>
                <span>{isVehicle ? 'Faktor Penggunaan Kendaraan:' : 'Kelas Risiko Pekerjaan:'}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">
                    {isVehicle ? 'Pribadi / Santai:' : 'Rendah:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={occLow}
                      onChange={(e) => setOccLow(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label="Faktor Risiko Pekerjaan Rendah"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">
                    {isVehicle ? 'Harian Kota:' : 'Standar:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={occStandard}
                      onChange={(e) => setOccStandard(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label="Faktor Risiko Pekerjaan Standar"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">
                    {isVehicle ? 'Komersial / Logistik:' : 'Tinggi:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={occHigh}
                      onChange={(e) => setOccHigh(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-amber-300 rounded text-center text-xs font-mono font-bold text-amber-700"
                      aria-label="Faktor Risiko Pekerjaan Tinggi"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
              </div>
              <span className="block text-[10px] text-slate-400">
                {isVehicle ? 'Pribadi vs Harian Kota vs Logistik' : 'Office vs Teknisi vs Hazard'}
              </span>
            </div>

            {/* Frequency Loading Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <span>💳</span>
                <span>Loading Cara Bayar:</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">Tahunan:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={freqAnnual}
                      onChange={(e) => setFreqAnnual(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label="Loading Cara Bayar Tahunan"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">Semesteran:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={freqSemiAnnual}
                      onChange={(e) => setFreqSemiAnnual(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label="Loading Cara Bayar Semesteran"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">Kuartalan:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={freqQuarterly}
                      onChange={(e) => setFreqQuarterly(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label="Loading Cara Bayar Kuartalan"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600">Bulanan:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="3.0"
                      value={freqMonthly}
                      onChange={(e) => setFreqMonthly(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900"
                      aria-label="Loading Cara Bayar Bulanan"
                    />
                    <span className="text-xs font-mono text-slate-500">x</span>
                  </div>
                </div>
              </div>
              <span className="block text-[10px] text-slate-400">Loading administrasi periodik</span>
            </div>
          </div>
        </div>

        {/* Section 4: Live Synchronization Callout */}
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

