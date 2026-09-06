'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { Input } from '@/components/atoms/Input';
import { Callout } from '@/components/molecules/Callout';

export interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  applicantName?: string;
  applicantEmail?: string;
  underwriterName?: string;
  underwriterNip?: string;
  onSubmitReject?: (data: {
    ojkCode: string;
    justification: string;
    pin: string;
  }) => void;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  applicationId = 'APP-2026-8819',
  applicantName = 'Bayu Pratama',
  applicantEmail = 'bayu.pratama@example.com',
  underwriterName = 'Bayu Pratama',
  underwriterNip = 'UW-2026-042',
  onSubmitReject,
}) => {
  const [ojkCode, setOjkCode] = useState('OJK-UW-403');
  const [justification, setJustification] = useState(
    'Rasio pengeluaran dan cicilan terhadap pendapatan bersih melebihi batas toleransi risiko aktuaris (DSR > 15%). Profil keuangan pemohon tidak memenuhi mitigasi risiko gagal bayar premi.'
  );
  const [pin, setPin] = useState('');
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

  const ojkCodeOptions = [
    {
      value: 'OJK-UW-403',
      label: 'KODE OJK-UW-403: Rasio Hutang/Pendapatan (DSR) Melampaui Batas (>15%)',
    },
    {
      value: 'OJK-UW-401',
      label: 'KODE OJK-UW-401: Ketidaksesuaian Identitas Dukcapil / Dugaan Manipulasi',
    },
    {
      value: 'OJK-UW-402',
      label: 'KODE OJK-UW-402: Riwayat Medis Kritis Tidak Memenuhi Kriteria Produk',
    },
    {
      value: 'OJK-UW-404',
      label: 'KODE OJK-UW-404: Dokumen Pendukung Tidak Sah / Ditolak Verifikasi Legal',
    },
    {
      value: 'OJK-UW-499',
      label: 'KODE OJK-UW-499: Pertimbangan Khusus Komite Aktuaris Lainnya',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onSubmitReject?.({
        ojkCode,
        justification,
        pin,
      });
      setIsSubmitting(false);
      onClose();
    }, 450);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      badgeText="UNDERWRITING ACTION • PENOLAKAN APLIKASI"
      badgeVariant="rose"
      title="Tolak Pengajuan Polis Asuransi"
      subtitle={`Aplikasi #${applicationId} • Keputusan penolakan berdasarkan regulasi AAJI & ketentuan underwriting.`}
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
              disabled={!justification.trim() || pin.length < 4 || isSubmitting}
              onClick={handleSubmit}
              className="bg-rose-600 hover:bg-rose-700 shadow-sm"
            >
              {isSubmitting ? 'Memproses Penolakan...' : 'Konfirmasi Tolak Pengajuan ❌'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Applicant Summary */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Nama Pemohon</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{applicantName}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Email Resmi</span>
            <p className="font-mono text-slate-600 text-xs mt-0.5">{applicantEmail}</p>
          </div>
        </div>

        {/* Section 1: Standard Rejection Reason */}
        <Select
          label="Kode Alasan Penolakan Standar (Kepatuhan OJK & AAJI)*"
          value={ojkCode}
          onChange={(e) => setOjkCode(e.target.value)}
          options={ojkCodeOptions}
        />

        {/* Section 2: Technical Justification Notes */}
        <Textarea
          label="Catatan Justifikasi Teknis Underwriting (Wajib untuk Audit Kepatuhan)*"
          rows={3}
          maxLength={500}
          showCount
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          helperText="Catatan ini menjadi arsip resmi bagi komite kepatuhan dan dasar hukum surat penolakan resmi."
        />

        {/* Section 3: Underwriter PIN & Auth */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Otorisasi Lead Underwriter
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="NIP Underwriter"
              value={underwriterNip}
              readOnly
              disabled
            />
            <Input
              label="PIN Otorisasi (Minimal 4 Angka)*"
              type="password"
              placeholder="Masukkan PIN keamanan..."
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              helperText="PIN konfirmasi otorisasi keputusan akhir."
            />
          </div>
        </div>

        {/* Rejection Notification Notice */}
        <Callout variant="danger" title="Konsekuensi Penolakan Aplikasi:">
          Surat penolakan resmi berformat PDF ber-QR Code penolakan OJK otomatis dikirimkan ke email{' '}
          <strong>{applicantEmail}</strong>. Status aplikasi akan ditandai permanen sebagai{' '}
          <strong>REJECTED</strong>.
        </Callout>
      </form>
    </Modal>
  );
};
