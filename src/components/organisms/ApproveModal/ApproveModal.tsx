'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Callout } from '@/components/molecules/Callout';

export interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  applicantName?: string;
  applicantEmail?: string;
  productName?: string;
  sumAssured?: string;
  premium?: string;
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
  policyNumberPreview = 'POL-2026-09-8819',
  underwriterName = 'Bayu Pratama',
  underwriterNip = 'UW-2026-042',
  onConfirmApprove,
}) => {
  const [sendAgentCopy, setSendAgentCopy] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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
      size="xl"
      badgeText="UNDERWRITING ACTION • PERSETUJUAN POLIS"
      badgeVariant="emerald"
      title="Setujui & Terbitkan Polis Resmi (e-Policy)"
      subtitle={`Aplikasi #${applicationId} • Penerbitan polis asuransi terverifikasi QR Code OJK.`}
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
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isProcessing}
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              {isProcessing ? 'Menerbitkan Polis...' : 'Setujui & Terbitkan Polis ✨'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Policy Summary Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ringkasan Polis yang Disetujui
            </span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded text-xs">
              {policyNumberPreview}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Nama Tertanggung</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{applicantName}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{applicantEmail}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Produk Asuransi</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{productName}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Uang Pertanggungan (UP)</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5 font-mono">{sumAssured}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Premi Pertama Disepakati</span>
              <p className="font-bold text-emerald-700 text-sm mt-0.5 font-mono">{premium}</p>
            </div>
          </div>
        </div>

        {/* Official Notification Channel Box (Email Only) */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-base">📧</span>
            <span className="font-bold text-slate-900">
              Notifikasi Email Resmi (e-Policy)
            </span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Email Only
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Sistem otomatis mengirimkan buku polis digital lengkap (PDF 28 halaman dengan tanda tangan digital &amp; QR Code OJK) serta bukti tagihan premi ke alamat <strong>{applicantEmail}</strong>.
          </p>
          <div className="pt-2">
            <Checkbox
              id="copy-agent"
              checked={sendAgentCopy}
              onChange={(e) => setSendAgentCopy(e.target.checked)}
              label="Kirim salinan konfirmasi terbit polis ke agen penutup / branch supervisor"
            />
          </div>
        </div>

        {/* Compliance Callout */}
        <Callout variant="success" title="Verifikasi Kepatuhan Aktuaris:">
          Keempat pilar verifikasi telah terkonfirmasi memenuhi standar underwriting. Keputusan ini bersifat final dan otomatis tercatat pada audit trail Core API.
        </Callout>
      </div>
    </Modal>
  );
};
