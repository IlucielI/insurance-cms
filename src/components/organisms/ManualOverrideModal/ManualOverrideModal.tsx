'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { RadioCard } from '@/components/atoms/RadioCard';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { PillarStatus } from '@/components/molecules/PillarReviewCard';

export interface ManualOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  pillarNumber?: number;
  pillarName?: string;
  currentStatus?: PillarStatus;
  currentEngine?: string;
  underwriterName?: string;
  underwriterNip?: string;
  onSubmit?: (data: {
    newStatus: PillarStatus;
    category: string;
    justification: string;
  }) => void;
}

export const ManualOverrideModal: React.FC<ManualOverrideModalProps> = ({
  isOpen,
  onClose,
  applicationId = 'APP-2026-8819',
  pillarNumber = 2,
  pillarName = 'Verifikasi Pendapatan & Debt-to-Income (DSR)',
  currentStatus = 'PASSED',
  currentEngine = 'System DSR Calculator',
  underwriterName = 'Bayu Pratama',
  underwriterNip = 'UW-2026-042',
  onSubmit,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PillarStatus>('FLAGGED');
  const [reasonCategory, setReasonCategory] = useState(
    'Inkonsistensi Nilai Gaji: Slip Gaji 1 Bulan Berbeda dengan Rata-Rata Rekening Koran'
  );
  const [justification, setJustification] = useState(
    'Setelah dilakukan cross-check manual, slip gaji bulan Juli menunjukkan komponen bonus yang tidak bersifat tetap. Gaji pokok dasar perlu diklarifikasi dengan rekening koran legalisir 3 bulan terakhir sebelum keputusan persetujuan akhir diterbitkan.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsSubmitting(false);
    onClose();
  };

  const statusOptions: {
    status: PillarStatus;
    title: string;
    description: string;
    badgeText: string;
    badgeVariant: 'emerald' | 'amber' | 'rose' | 'slate';
    icon: string;
  }[] = [
    {
      status: 'PASSED',
      title: 'PASSED (Lolos Verifikasi Penuh)',
      description: 'Semua dokumen dan angka perhitungan memenuhi kriteria underwriting standar.',
      badgeText: 'Auto / Manual Pass',
      badgeVariant: 'emerald',
      icon: '🟢',
    },
    {
      status: 'FLAGGED',
      title: 'FLAGGED / REQUIRE_DOCUMENTS (Perlu Dokumen Tambahan)',
      description: 'Ditemukan inkonsistensi minor. Mengharuskan nasabah mengunggah berkas legalisir.',
      badgeText: 'Rekomendasi RFI',
      badgeVariant: 'amber',
      icon: '🟡',
    },
    {
      status: 'FAILED',
      title: 'FAILED (Gagal Verifikasi / Tolak Pilar)',
      description: 'Terindikasi pemalsuan dokumen atau rasio DSR melebihi ambang batas toleransi.',
      badgeText: 'Penolakan Aplikasi',
      badgeVariant: 'rose',
      icon: '🔴',
    },
    {
      status: 'WAIVED',
      title: 'WAIVED (Dikecualikan Khusus)',
      description: 'Kelonggaran khusus berdasarkan memo aktuaris atau portofolio nasabah eksisting.',
      badgeText: 'Special Exception',
      badgeVariant: 'slate',
      icon: '⚪',
    },
  ];

  const reasonCategories = [
    {
      value: 'Inkonsistensi Nilai Gaji: Slip Gaji 1 Bulan Berbeda dengan Rata-Rata Rekening Koran',
      label: 'Inkonsistensi Nilai Gaji: Slip Gaji 1 Bulan Berbeda dengan Rata-Rata Rekening Koran',
    },
    {
      value: 'Dokumen Buram / Tanda Tangan Tidak Terbaca oleh OCR Worker',
      label: 'Dokumen Buram / Tanda Tangan Tidak Terbaca oleh OCR Worker',
    },
    {
      value: 'Komponen Bonus Tidak Tetap Diikutsertakan Sebagai Gaji Pokok',
      label: 'Komponen Bonus Tidak Tetap Diikutsertakan Sebagai Gaji Pokok',
    },
    {
      value: 'Profil Risiko Tambahan Berdasarkan Skrining Riwayat Klaim Asosiasi',
      label: 'Profil Risiko Tambahan Berdasarkan Skrining Riwayat Klaim Asosiasi',
    },
    {
      value: 'Lainnya: Justifikasi Khusus Lead Underwriter',
      label: 'Lainnya: Justifikasi Khusus Lead Underwriter',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onSubmit?.({
        newStatus: selectedStatus,
        category: reasonCategory,
        justification,
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      badgeText="UNDERWRITING ACTION • MANUAL OVERRIDE"
      badgeVariant="indigo"
      title="Ubah Status & Manual Override Pilar Verifikasi"
      subtitle={`Aplikasi #${applicationId} • Menyesuaikan status evaluasi otomatis dari underwriting worker.`}
      footer={
        <div className="w-full space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Diverifikasi oleh: <span className="font-semibold text-slate-800">{underwriterName} (NIP: {underwriterNip})</span> • Waktu Override: 06 Sep 2026, 08:38 WIB
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!justification.trim() || isSubmitting}
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                {isSubmitting ? 'Menerapkan...' : 'Terapkan Perubahan Status Pilar & Perbarui Antrean 💾'}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            Aksi ini akan mencatat audit hash sha256 baru di Core API &amp; mengupdate status queue.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Section 1: Current Status Display */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. PILAR EVALUASI YANG DIUBAH:
          </label>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">
                Pilar {pillarNumber}: {pillarName}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {currentStatus} (Auto)
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Gaji Pokok: IDR 25.000.000/bln (Slip Gaji terlampir) • Premi IDR 450.000/bln • Rasio DSR: 1.8% (Batas Maks: 15%)
            </p>
            <p className="text-[10px] text-slate-400">
              Diverifikasi Awal oleh: {currentEngine || 'System DSR Calculator Engine (Auto)'}
            </p>
          </div>
        </div>

        {/* Section 2: Choose 4 New Status RadioCards */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. PILIH STATUS BARU (MANUAL OVERRIDE BY LEAD UNDERWRITER):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {statusOptions.map((opt) => (
              <RadioCard
                key={opt.status}
                name="pillar-override-status"
                value={opt.status}
                title={opt.title}
                description={opt.description}
                badgeText={opt.badgeText}
                badgeVariant={opt.badgeVariant}
                icon={opt.icon}
                selected={selectedStatus === opt.status}
                onChange={() => setSelectedStatus(opt.status)}
              />
            ))}
          </div>
        </div>

        {/* Section 3: Reason Category & Justification */}
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              3. JUSTIFIKASI TEKNIS MANUAL OVERRIDE (WAJIB UNTUK AUDIT ISO 27001):
            </label>
            <span className="text-[11px] text-slate-600 block">Kategori Alasan Penyesuaian:</span>
            <Select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              options={reasonCategories}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-600 block">Catatan Rinci Underwriter:</span>
            <Textarea
              rows={3}
              maxLength={500}
              showCount
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>
        </div>

        {/* Section 4: Workbench Impact Box */}
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1 text-slate-700 text-xs">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <span>⚡</span>
            <span>DAMPAK PERUBAHAN STATUS TERHADAP WORKBENCH UNDERWRITING:</span>
          </div>
          <p className="text-[11px] text-slate-600 pl-4">
            1. Tombol &quot;Setujui &amp; Terbitkan Polis&quot; di bagian bawah workbench akan OTOMATIS TERKUNCI (DISABLED).
          </p>
          <p className="text-[11px] text-slate-600 pl-4">
            2. Sistem akan menyarankan aktivasi aksi &quot;Minta Dokumen Tambahan (RFI)&quot; kepada nasabah.
          </p>
        </div>
      </form>
    </Modal>
  );
};
