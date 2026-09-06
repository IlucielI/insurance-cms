'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';

export interface UploadKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UploadKnowledgeModal: React.FC<UploadKnowledgeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fileName, setFileName] = useState('Polis_Baku_Secure_Life_Plus_v2.pdf');
  const [fileSize] = useState('3.4 MB');
  const [pageCount] = useState(28);
  const [wordCount] = useState('14.800');
  const [chunkCount] = useState(48);
  const [isPublishing, setIsPublishing] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate brief pipeline completion
    timerRef.current = setTimeout(() => {
      setIsPublishing(false);
      onSuccess?.();
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      badgeText="KNOWLEDGE INGESTION • RAG PIPELINE"
      badgeVariant="indigo"
      title="Unggah Dokumen Polis & Pipeline Embedding"
      subtitle="Ingest berkas PDF (Polis Baku / RIPLAY / Regulasi OJK) untuk memperluas basis pengetahuan AI Asisten."
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>🔒</span>
            <span>Dokumen terenkripsi AES-256 &amp; disimpan di repositori dokumen privat Core API.</span>
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Tutup Dialog
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? 'Memproses...' : 'Publikasikan ke Knowledge AI Assistant ✅'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Section 1: Berkas Dokumen Sumber Knowledge (PDF) */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. BERKAS DOKUMEN SUMBER KNOWLEDGE (PDF):
          </label>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                📄
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 font-mono break-all">{fileName}</h4>
                <p className="text-xs text-slate-500">
                  Ukuran: {fileSize} • {pageCount} Halaman • Tipe: Standar Klausul Polis OJK • OCR Status:{' '}
                  <span className="text-emerald-600 font-semibold">100% Terbaca Jelas</span>
                </p>
              </div>
            </div>
            <label className="inline-flex items-center justify-center px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm flex-shrink-0">
              <span>Ganti File ↺</span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Upload PDF Berkas Polis"
              />
            </label>
          </div>
        </div>

        {/* Section 2: Tahapan Proses Ingestion ke Vector DB (pgvector) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. TAHAPAN PROSES INGESTION KE VECTOR DB (PGVECTOR):
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {/* Step 1 */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 text-xs font-extrabold flex items-center justify-center font-mono">
                  01
                </span>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Ekstraksi Teks &amp; OCR Engine</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Membaca {pageCount} halaman PDF, menyaring diagram, dan mengekstrak {wordCount} kata teks bersih.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase">
                ✓ SELESAI
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 text-xs font-extrabold flex items-center justify-center font-mono">
                  02
                </span>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Semantic Chunking &amp; Overlapping</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Memecah teks menjadi {chunkCount} chunks terstruktur (Chunk Size: 512 tokens, Overlap: 64 tokens) untuk menjaga konteks klausul.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase">
                ✓ {chunkCount} CHUNKS
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 text-xs font-extrabold flex items-center justify-center font-mono">
                  03
                </span>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    Generasi Embedding Vektor (text-embedding-3-small)
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Menghasilkan vektor densitas 1536-dimensi untuk setiap chunk dan meng-upsert ke tabel PostgreSQL pgvector.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase">
                ✓ 100% INDEXED
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 text-xs font-extrabold flex items-center justify-center font-mono">
                  04
                </span>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Publikasi Live ke RAG Query Engine</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dokumen langsung aktif diindeks oleh Cosine Similarity Retriever. Chatbot customer (06 Tanya AI) siap menjawab pertanyaan.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE AKTIF
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Uji Retrieval Instan (Simulasi Pertanyaan Nasabah) */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. UJI RETRIEVAL INSTAN (SIMULASI PERTANYAAN NASABAH):
          </label>
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-700">
                PERTANYAAN UJI (QUERY TEST):
              </span>
              <p className="text-xs font-semibold text-slate-900">
                &ldquo;Berapa hari garansi batas waktu pencairan uang santunan klaim meninggal dunia?&rdquo;
              </p>
            </div>
            <div className="p-3 bg-white border border-indigo-100 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  HASIL RETRIEVAL DARI DOKUMEN YANG BARU DIUNGGAH:
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  SIMILARITY SCORE: 0.942
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;Berdasarkan Bab IV Pasal 14 Dokumen yang baru diunggah: Klaim meninggal dunia memiliki Garansi
                SLA Pencairan Maksimal 3 Hari Kerja ke rekening ahli waris yang sah setelah berkas lengkap terverifikasi
                tim underwriting.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
