'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Textarea } from '@/components/atoms/Textarea';
import { Select } from '@/components/atoms/Select';

export interface RFIModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  applicantName?: string;
  applicantEmail?: string;
  underwriterName?: string;
  underwriterNip?: string;
  onSubmitRFI?: (data: {
    requestedDocs: string[];
    deadlineDays: string;
    customNote: string;
  }) => void;
}

export const RFIModal: React.FC<RFIModalProps> = ({
  isOpen,
  onClose,
  applicationId = 'APP-2026-8819',
  applicantName = 'Bayu Pratama',
  applicantEmail = 'bayu.pratama@example.com',
  underwriterName = 'Bayu Pratama',
  underwriterNip = 'UW-2026-042',
  onSubmitRFI,
}) => {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([
    'ktp-hd',
    'rekening-koran',
  ]);
  const [deadline, setDeadline] = useState('3');
  const [customNote, setCustomNote] = useState(
    `Halo Bapak ${applicantName}, mohon bantuannya untuk mengunggah ulang foto e-KTP Anda dengan pencahayaan yang jelas dan seluruh sudut kartu terlihat, serta melampirkan file slip gaji 3 bulan terakhir. Dokumen ini diperlukan agar kami dapat segera memproses polis Secure Life Plus Anda.`
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

  const documentOptions = [
    {
      id: 'ktp-hd',
      label: 'Foto Ulang Fisik e-KTP (Resolusi Tinggi & Tanpa Pantulan Cahaya)',
      description: 'Hasil scan pertama terpotong di bagian sudut NIK',
    },
    {
      id: 'rekening-koran',
      label: 'Slip Gaji 3 Bulan Terakhir / Rekening Koran Legalisir Bank',
      description: 'Untuk verifikasi kapasitas DSR penghasilan',
    },
    {
      id: 'resume-medis',
      label: 'Surat Keterangan Riwayat Medis / Resume Rawat Inap Rumah Sakit',
      description: 'Opsional jika ada riwayat operasi dalam 2 tahun terakhir',
    },
    {
      id: 'surat-narkoba',
      label: 'Surat Pernyataan Bebas Narkoba & Zat Adiktif (BAP)',
      description: 'Khusus kriteria pertanggungan profesi risiko tinggi',
    },
  ];

  const deadlineOptions = [
    { value: '3', label: '⏱️  3 x 24 Jam (Maks. 09 Sep 2026, 23:59 WIB)' },
    { value: '7', label: '⏱️  7 x 24 Jam (Maks. 13 Sep 2026, 23:59 WIB)' },
    { value: '14', label: '⏱️  14 x 24 Jam (Maks. 20 Sep 2026, 23:59 WIB)' },
  ];

  const reminderOptions = [
    { value: 'h-1', label: '🔔  Kirim Pengingat Otomatis H-1 via Email' },
    { value: 'h-2', label: '🔔  Kirim Pengingat Otomatis H-2 via Email' },
    { value: 'none', label: '🔕  Tanpa Pengingat Otomatis' },
  ];

  const handleToggleDoc = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onSubmitRFI?.({
        requestedDocs: selectedDocs,
        deadlineDays: deadline,
        customNote,
      });
      setIsSubmitting(false);
      onClose();
    }, 450);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      badgeText="UNDERWRITING ACTION • PERMINTAAN BERKAS (RFI)"
      badgeVariant="amber"
      title="Permintaan Dokumen Tambahan ke Nasabah"
      subtitle={`Aplikasi #${applicationId} • Nasabah akan menerima notifikasi email & portal pengunggahan aman.`}
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
                disabled={selectedDocs.length === 0 || !customNote.trim() || isSubmitting}
                onClick={handleSubmit}
                className="bg-amber-600 hover:bg-amber-700 shadow-sm"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan Dokumen Tambahan ke Nasabah 📤'}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            Tautan upload aman terenkripsi HTTPS akan dikirimkan otomatis ke {applicantEmail}.
          </p>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Section 1: Document Checklist */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. PILIH BERKAS TAMBAHAN YANG WAJIB DIUNGGAH NASABAH:
          </label>
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {documentOptions.map((doc) => (
              <div
                key={doc.id}
                className="p-2.5 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 transition-colors"
              >
                <Checkbox
                  id={`rfi-doc-${doc.id}`}
                  checked={selectedDocs.includes(doc.id)}
                  onChange={() => handleToggleDoc(doc.id)}
                  label={doc.label}
                  description={doc.description}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Batas Waktu Pengunggahan (SLA Deadline) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. BATAS WAKTU PENGUNGGAHAN (SLA DEADLINE):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              options={deadlineOptions}
            />
            <Select
              defaultValue="h-1"
              options={reminderOptions}
            />
          </div>
        </div>

        {/* Section 3: Instruksi Khusus untuk Nasabah */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. INSTRUKSI KHUSUS UNTUK NASABAH (TAMPIL DI EMAIL &amp; APLIKASI):
          </label>
          <Textarea
            rows={3}
            maxLength={400}
            showCount
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
          />
        </div>

        {/* Callout Info */}
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1 text-slate-700">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <span>ℹ️</span>
            <span>Status aplikasi akan otomatis berubah menjadi: REQUIRE_DOCUMENTS (Menunggu Dokumen Nasabah).</span>
          </div>
          <p className="text-[11px] text-slate-600 pl-5">
            SLA underwriting 3 hari kerja akan di-pause sementara hingga nasabah berhasil mengunggah berkas yang diminta.
          </p>
        </div>
      </div>
    </Modal>
  );
};
