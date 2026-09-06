'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { Input } from '@/components/atoms/Input';

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
  const [ojkCode, setOjkCode] = useState('OJK-UW-402');
  const [justification, setJustification] = useState(
    'Berdasarkan rekam medis yang dianalisis oleh engine underwriting Core API, pemohon memiliki riwayat penyakit kritis yang berada di luar koridor pertanggungan Secure Life Plus. Kenaikan risiko mortalitas mencapai 3.20x di atas ambang batas maksimum perusahaan (1.80x). Sesuai Bab IV Ketentuan Polis, aplikasi ditolak secara resmi.'
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
      value: 'OJK-UW-402',
      label: '🚫  KODE OJK-UW-402: Riwayat Penyakit Pra-Ada (Pre-Existing Condition) Melebihi Batas Toleransi Risiko',
    },
    {
      value: 'OJK-UW-401',
      label: '🚫  KODE OJK-UW-401: Ketidaksesuaian Identitas Dokumen & Data Dukcapil (Fraud Alert)',
    },
    {
      value: 'OJK-UW-403',
      label: '🚫  KODE OJK-UW-403: Rasio Hutang/Pendapatan (DSR > 15%) Melampaui Batas Finansial',
    },
    {
      value: 'OJK-UW-404',
      label: '🚫  KODE OJK-UW-404: Dokumen Pendukung Tidak Sah / Ditolak Verifikasi Legal',
    },
    {
      value: 'OJK-UW-499',
      label: '🚫  KODE OJK-UW-499: Pertimbangan Khusus Komite Aktuaris Lainnya',
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
      title="Penolakan Aplikasi Polis Asuransi"
      subtitle={`Aplikasi #${applicationId} • Pemohon: ${applicantName} • Tindakan ini bersifat final dan mencatat alasan aktuarial resmi sesuai regulasi OJK & AAJI.`}
      footer={
        <div className="w-full space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Underwriter: <span className="font-semibold text-slate-800">{underwriterName} ({underwriterNip})</span>
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
                {isSubmitting ? 'Memproses Penolakan...' : 'Konfirmasi Tolak Pengajuan Resmi ❌ (Status: REJECTED)'}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            Data penolakan tersimpan permanen di log integritas sistem Core API dan tidak dapat dibatalkan (Irreversible).
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Section 1: Standard Rejection Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. ALASAN UTAMA PENOLAKAN (STANDAR KODE REGULASI OJK &amp; AAJI):
          </label>
          <Select
            value={ojkCode}
            onChange={(e) => setOjkCode(e.target.value)}
            options={ojkCodeOptions}
          />
        </div>

        {/* Section 2: Technical Justification Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. JUSTIFIKASI TEKNIS PENOLAKAN UNDERWRITING (WAJIB UNTUK AUDIT AAJI):
          </label>
          <Textarea
            rows={3}
            maxLength={500}
            showCount
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
        </div>

        {/* Section 3: Underwriter PIN & Auth */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. KONFIRMASI OTORITAS LEAD UNDERWRITER:
          </label>
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">
              🔒 Validasi NIP &amp; Kode PIN Otorisasi:
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
              />
            </div>
          </div>
        </div>

        {/* Rejection Notification Notice */}
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 text-slate-700 text-xs flex items-center gap-2">
          <span className="text-base">📧</span>
          <span>Surat penolakan resmi bersurat kop PT Bayu Insurance Digital Indonesia akan dikirimkan ke email nasabah ({applicantEmail}) secara otomatis.</span>
        </div>
      </form>
    </Modal>
  );
};
