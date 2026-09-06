'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';

export interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  applicantName?: string;
  applicantEmail?: string;
  productName?: string;
  sumAssured?: string;
  premium?: string;
  tenorYears?: number;
  effectiveDate?: string | Date;
  policyNumberPreview?: string;
  underwriterName?: string;
  underwriterNip?: string;
  onConfirmApprove?: () => void;
}

export const ApproveModal: React.FC<ApproveModalProps> = ({
  isOpen,
  onClose,
  applicationId = 'APP-2026-8819',
  applicantName = 'Bayu Pratama',
  applicantEmail = 'bayu.pratama@example.com',
  productName = 'Term Life Guard Plus (10 Tahun)',
  sumAssured = 'Rp 1.000.000.000',
  premium = 'Rp 450.000 / bulan',
  tenorYears = 10,
  effectiveDate,
  policyNumberPreview = 'POL-2026-09-8819',
  underwriterName = 'Bayu Pratama',
  underwriterNip = 'UW-2026-042',
  onConfirmApprove,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = effectiveDate ? new Date(effectiveDate) : new Date();
  const validityYears = tenorYears || 10;
  const end = new Date(start);
  end.setFullYear(start.getFullYear() + validityYears);

  const formatDateId = (d: Date) =>
    d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  const validityText = `Masa Berlaku Polis: ${formatDateId(start)} s/d ${formatDateId(end)} (${validityYears} Tahun Proteksi Aktif)`;

  const approvalTimestamp =
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(start) + ' WIB';

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
    setIsProcessing(false);
    onClose();
  };

  const handleApprove = () => {
    setIsProcessing(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onConfirmApprove?.();
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      badgeText="UNDERWRITING ACTION • PERSETUJUAN POLIS"
      badgeVariant="emerald"
      title="Persetujuan & Penerbitan Polis Final"
      subtitle={`Aplikasi #${applicationId} • Tertanggung: ${applicantName} (${applicantEmail}) • Polis aktif akan diterbitkan resmi.`}
      footer={
        <div className="w-full space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Underwriter: <span className="font-semibold text-slate-800">{underwriterName} (NIP: {underwriterNip})</span> • Waktu Persetujuan: {approvalTimestamp}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Kembali ke Review
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isProcessing}
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                {isProcessing ? 'Menerbitkan Polis...' : `Konfirmasi & Terbitkan Polis Resmi 🚀 (${policyNumberPreview})`}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            Aksi ini akan mencatat audit hash sha256 dan memicu penagihan autodebet pertama.
          </p>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Section 1: Data Polis Resmi yang Akan Diterbitkan */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. DATA POLIS RESMI YANG AKAN DITERBITKAN
          </span>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">NOMOR POLIS OTOMATIS:</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{policyNumberPreview}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">UANG PERTANGGUNGAN (UP):</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{sumAssured}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">PREMI TAHUNAN (AUTODEBET):</span>
                <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5 block">{premium}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 font-medium">
              {validityText}
            </div>
          </div>
        </div>

        {/* Section 2: Otomatisasi Sistem Setelah Persetujuan */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. OTOMATISASI SISTEM SETELAH PERSETUJUAN (LIVE SYSTEM ACTIONS)
          </span>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="font-bold text-slate-900">e-Sign Digital Signature OJK</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">Menyematkan sertifikat tanda tangan digital resmi pada dokumen polis baku.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">READY ✓</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="font-bold text-slate-900">Generasi Dokumen e-Policy PDF (28 Halaman)</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">Menghasilkan file PDF polis lengkap dengan watermarking nomor polis resmi.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 shrink-0">AUTO-GENERATE ✓</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="font-bold text-slate-900">Notifikasi Email Resmi (e-Policy)</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">Mengirimkan e-Policy beserta bukti bayar premi pertama ke email nasabah ({applicantEmail}).</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 shrink-0">SEND QUEUE ✓</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="font-bold text-slate-900">Aktivasi Polis di Customer App (01-06)</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">Akun nasabah otomatis memiliki kartu polis aktif di dashboard aplikasi mobile/web.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">INSTANT LIVE 🟢</span>
            </div>
          </div>
        </div>

        {/* Section 3: Catatan Resmi Audit Underwriter */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. CATATAN RESMI AUDIT UNDERWRITER (AUDIT LOG ISO 27001)
          </span>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed text-xs">
            Semua 4 pilar checks terverifikasi valid tanpa anomali. Verifikasi identitas Dukcapil OCR mencapai 99.4%, rasio premi terhadap pendapatan sangat sehat (1.8%), tidak membutuhkan skrining medis khusus. Disetujui untuk langsung diterbitkan polis aktif nomor {policyNumberPreview}.
          </div>
        </div>
      </div>
    </Modal>
  );
};
