'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { RadioCard } from '@/components/atoms/RadioCard';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { Callout } from '@/components/molecules/Callout';
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
    'Ditemukan selisih mutasi kredit pada rekening koran bulan ke-2 sebesar 25% lebih rendah dibandingkan angka bruto slip gaji. Memerlukan konfirmasi bukti potong PPh 21 atau rekening koran legalisir bank.'
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
      title: 'PASSED (Lolos Penuh)',
      description: 'Semua data dan bukti dokumen telah terkonfirmasi valid sesuai standar aktuarial.',
      badgeText: 'Auto / Manual Pass',
      badgeVariant: 'emerald',
      icon: '🟢',
    },
    {
      status: 'FLAGGED',
      title: 'FLAGGED / REQUIRE_DOCUMENTS (Butuh Berkas)',
      description: 'Ditemukan inkonsistensi minor. Mengharuskan nasabah mengunggah berkas legalisir.',
      badgeText: 'Rekomendasi RFI',
      badgeVariant: 'amber',
      icon: '🟡',
    },
    {
      status: 'FAILED',
      title: 'FAILED (Gagal Verifikasi)',
      description: 'Indikasi pemalsuan data, manipulasi slip gaji, atau rasio DSR > 15% melampaui limit risiko.',
      badgeText: 'Penolakan Aplikasi',
      badgeVariant: 'rose',
      icon: '🔴',
    },
    {
      status: 'WAIVED',
      title: 'WAIVED (Dikecualikan Khusus)',
      description: 'Pengecualian kewenangan Lead Underwriter berdasarkan memo komite portofolio.',
      badgeText: 'Special Exception',
      badgeVariant: 'slate',
      icon: '⚪',
    },
  ];

  const reasonCategories = [
    {
      value: 'Inkonsistensi Nilai Gaji: Slip Gaji 1 Bulan Berbeda dengan Rata-Rata Rekening Koran',
      label: 'Inkonsistensi Nilai Gaji: Slip Gaji vs Mutasi Rekening Koran',
    },
    {
      value: 'Dokumen Buram / Tanda Tangan Tidak Terbaca oleh OCR Worker',
      label: 'Dokumen Buram / Tanda Tangan Tidak Terbaca oleh OCR',
    },
    {
      value: 'Komponen Bonus Tidak Tetap Diikutsertakan Sebagai Gaji Pokok',
      label: 'Komponen Bonus Tidak Tetap Diikutsertakan Sebagai Gaji Pokok',
    },
    {
      value: 'Profil Risiko Tambahan Berdasarkan Skrining Riwayat Klaim Asosiasi',
      label: 'Profil Risiko Tambahan Berdasarkan Riwayat Klaim AAJI',
    },
    {
      value: 'Lainnya: Justifikasi Khusus Lead Underwriter',
      label: 'Lainnya (Tuliskan secara lengkap pada teks justifikasi)',
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
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Otoritas:</span>
            <span className="font-semibold text-slate-800">
              {underwriterName} ({underwriterNip})
            </span>
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
              {isSubmitting ? 'Menerapkan...' : 'Terapkan Perubahan Status Pilar 💾'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Current Status Display */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pilar Terpilih (Pilar {pillarNumber})
            </span>
            <p className="font-bold text-slate-900 text-sm">{pillarName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Status Awal:</span>
            <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              🟢 {currentStatus} (Auto oleh {currentEngine})
            </span>
          </div>
        </div>

        {/* Section 2: Choose 4 New Status RadioCards */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Pilih Status Evaluasi Baru (Manual Override)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="grid grid-cols-1 gap-4 pt-1">
          <Select
            label="Kategori Alasan Override (Kepatuhan Audit AAJI)"
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            options={reasonCategories}
          />

          <Textarea
            label="Catatan Rinci Justifikasi Underwriter (Wajib Diisi)*"
            rows={3}
            maxLength={500}
            showCount
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            helperText="Catatan ini akan direkam secara permanen dalam audit trail dan tercantum pada laporan kepatuhan komite risiko."
          />
        </div>

        {/* Section 4: Workbench Impact Callout */}
        {selectedStatus === 'FLAGGED' && (
          <Callout variant="warning" title="Dampak Nyata Terhadap Workbench:">
            Tombol <strong>&quot;Setujui &amp; Terbitkan Polis&quot;</strong> pada bagian bawah workbench
            otomatis <strong>TERKUNCI (DISABLED)</strong>. Sistem otomatis menyarankan aktivasi aksi{' '}
            <strong>&quot;Minta Dokumen Tambahan (RFI)&quot;</strong> kepada pemohon.
          </Callout>
        )}

        {selectedStatus === 'FAILED' && (
          <Callout variant="danger" title="Dampak Nyata Terhadap Workbench:">
            Tombol <strong>&quot;Setujui &amp; Terbitkan Polis&quot;</strong> otomatis terkunci dan status aplikasi akan beralih ke jalur{' '}
            <strong>Penolakan Aplikasi</strong> dengan surat resmi kode OJK.
          </Callout>
        )}

        {selectedStatus === 'PASSED' && (
          <Callout variant="success" title="Dampak Nyata Terhadap Workbench:">
            Seluruh pilar kembali berada dalam kondisi lolos. Jika pilar lainnya lengkap, tombol{' '}
            <strong>&quot;Setujui &amp; Terbitkan Polis&quot;</strong> akan aktif dan siap diproses.
          </Callout>
        )}
      </form>
    </Modal>
  );
};
