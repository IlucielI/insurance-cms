'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Textarea } from '@/components/atoms/Textarea';
import { Select } from '@/components/atoms/Select';
import { Callout } from '@/components/molecules/Callout';

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
    'rekening-koran',
    'spt-pajak',
  ]);
  const [deadline, setDeadline] = useState('3');
  const [customNote, setCustomNote] = useState(
    'Mohon unggah salinan rekening koran 3 bulan terakhir yang dilegalisir bank dan bukti potong PPh 21 tahun berjalan untuk verifikasi komponen pendapatan tetap.'
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
      id: 'rekening-koran',
      label: 'Rekening Koran 3 Bulan Terakhir (Legalisir Bank)',
      description: 'Menampilkan mutasi gaji masuk dan rata-rata saldo mengendap.',
    },
    {
      id: 'spt-pajak',
      label: 'Bukti Potong Pajak Penghasilan (PPh 21 / Form 1721-A1)',
      description: 'Digunakan untuk mengonfirmasi validitas slip gaji dari pemberi kerja.',
    },
    {
      id: 'resume-medis',
      label: 'Surat Keterangan Dokter Spesialis / Resume Medis Lengkap',
      description: 'Hasil skrining laboratorium darah lengkap dan riwayat rawat inap terakhir.',
    },
    {
      id: 'ktp-hd',
      label: 'Foto KTP Fisik Resolusi Tinggi (Tanpa Pantulan Kilap/Flash)',
      description: 'Diperlukan karena foto identitas pada pilar 1 terdeteksi blur oleh OCR.',
    },
  ];

  const deadlineOptions = [
    { value: '3', label: '3 Hari Kerja (Standar SLA Cepat OJK)' },
    { value: '7', label: '7 Hari Kalender (Disarankan jika ada pemeriksaan lab/klinik)' },
    { value: '14', label: '14 Hari Kalender (Pengecualian khusus pengurusan instansi)' },
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
      badgeText="UNDERWRITING ACTION • PERMINTAAN DOKUMEN (RFI)"
      badgeVariant="amber"
      title="Minta Dokumen Tambahan ke Nasabah (RFI)"
      subtitle={`Aplikasi #${applicationId} • Kirim instruksi upload berkas resmi langsung ke email ${applicantEmail}.`}
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
              disabled={selectedDocs.length === 0 || !customNote.trim() || isSubmitting}
              onClick={handleSubmit}
              className="bg-amber-600 hover:bg-amber-700 shadow-sm"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan Dokumen (RFI) 📤'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Document Checklist */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Pilih Jenis Dokumen yang Wajib Diunggah Nasabah:
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

        {/* Deadline Selector & Custom Instructions */}
        <div className="grid grid-cols-1 gap-4 pt-1">
          <Select
            label="Batas Waktu Pengunggahan Berkas (Deadline SLA)"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            options={deadlineOptions}
          />

          <Textarea
            label="Instruksi Khusus Underwriter (Akan tercantum di isi email nasabah)*"
            rows={3}
            maxLength={400}
            showCount
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            helperText="Tuliskan petunjuk yang jelas dan santun agar nasabah dapat mengunggah berkas dengan tepat."
          />
        </div>

        {/* Notification Channel Banner (Email Only) */}
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-2.5">
          <span className="text-base shrink-0">🔔</span>
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900">
              Notifikasi Email &amp; Pengingat Otomatis H-1
            </span>
            <p className="text-slate-600 leading-relaxed">
              Email resmi beserta tautan aman (*secure token*) ke Portal Unggah Berkas akan dikirimkan ke{' '}
              <strong>{applicantEmail}</strong> ({applicantName}). Sistem otomatis mengirimkan pengingat H-1 via email jika berkas belum diunggah.
            </p>
          </div>
        </div>

        <Callout variant="info" title="Status Antrean Setelah RFI Dikirim:">
          Status aplikasi akan otomatis berubah menjadi{' '}
          <strong className="text-amber-800">REQUIRE_DOCUMENTS</strong> dan dipindahkan sementara dari antrean aktif hingga nasabah mengunggah berkas baru.
        </Callout>
      </div>
    </Modal>
  );
};
