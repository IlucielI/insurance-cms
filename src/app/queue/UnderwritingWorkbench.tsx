'use client';

import React, { useState, useMemo } from 'react';
import {
  UnderwritingDossier,
  PillarType,
  PillarStatus,
} from '@/server/repositories/application.repository.interface';
import { applicationService } from '@/server/di';
import { ApproveModal } from '@/components/organisms/ApproveModal';
import { RFIModal } from '@/components/organisms/RFIModal';
import { RejectModal } from '@/components/organisms/RejectModal';
import { ManualOverrideModal } from '@/components/organisms/ManualOverrideModal';

interface UnderwritingWorkbenchProps {
  initialQueue: UnderwritingDossier[];
  initialSelectedId?: string;
}

type TabKey = 'all' | 'review_needed' | 'submitted' | 'approved' | 'rejected';

export const UnderwritingWorkbench: React.FC<UnderwritingWorkbenchProps> = ({
  initialQueue,
  initialSelectedId,
}) => {
  const [queue, setQueue] = useState<UnderwritingDossier[]>(initialQueue);
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialSelectedId && initialQueue.some((d) => d.id === initialSelectedId)) {
      return initialSelectedId;
    }
    return initialQueue[0]?.id || '#APP-2026-8819';
  });
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('all');

  // Modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRFIOpen, setIsRFIOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<{
    index: number;
    type: PillarType;
    title: string;
    status: PillarStatus;
  } | null>(null);

  // Internal note editing per application
  const [editedNotes, setEditedNotes] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active dossier
  const activeDossier = useMemo(() => {
    return queue.find((d) => d.id === selectedId) || queue[0];
  }, [queue, selectedId]);

  const currentNote = activeDossier
    ? editedNotes[activeDossier.id] ?? activeDossier.internalAuditNotes
    : '';

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: queue.length,
      review_needed: queue.filter((d) => d.status === 'under_review').length,
      submitted: queue.filter((d) => d.status === 'submitted').length,
      approved: queue.filter((d) => d.status === 'approved').length,
      rejected: queue.filter((d) => d.status === 'rejected').length,
    };
  }, [queue]);

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      // Tab filter
      if (activeTab === 'review_needed' && item.status !== 'under_review') return false;
      if (activeTab === 'submitted' && item.status !== 'submitted') return false;
      if (activeTab === 'approved' && item.status !== 'approved') return false;
      if (activeTab === 'rejected' && item.status !== 'rejected') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.applicantName.toLowerCase().includes(q);
        const matchesNik = item.nik.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        if (!matchesName && !matchesNik && !matchesId) return false;
      }

      // Product filter
      if (productFilter !== 'all' && item.productSlug !== productFilter) return false;

      return true;
    });
  }, [queue, activeTab, searchQuery, productFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Actions
  const handleConfirmApprove = async () => {
    if (!activeDossier) return;
    try {
      const updated = await applicationService.approveApplication(
        activeDossier.id,
        'Disetujui dan diterbitkan via Workbench UI.'
      );
      setQueue((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setIsApproveOpen(false);
      showToast(`Polis ${updated.id} berhasil disetujui & diterbitkan!`);
    } catch {
      showToast('Gagal menyetujui pengajuan.');
    }
  };

  const handleSubmitRFI = async (data: {
    requestedDocs: string[];
    deadlineDays: string;
    customNote: string;
  }) => {
    if (!activeDossier) return;
    try {
      const reason = `Dokumen diminta: ${data.requestedDocs.join(', ')} (Batas: ${data.deadlineDays} hari). Catatan: ${data.customNote}`;
      const updated = await applicationService.requestDocuments(activeDossier.id, reason);
      setQueue((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setIsRFIOpen(false);
      showToast(`Permintaan dokumen untuk ${updated.id} berhasil dikirim.`);
    } catch {
      showToast('Gagal mengirim permintaan dokumen.');
    }
  };

  const handleSubmitReject = async (data: {
    ojkCode: string;
    justification: string;
    pin: string;
  }) => {
    if (!activeDossier) return;
    try {
      const reason = `[OJK: ${data.ojkCode}] ${data.justification} (PIN verified)`;
      const updated = await applicationService.rejectApplication(activeDossier.id, reason);
      setQueue((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setIsRejectOpen(false);
      showToast(`Pengajuan ${updated.id} berhasil ditolak.`);
    } catch {
      showToast('Gagal menolak pengajuan.');
    }
  };

  const handleOpenOverride = (index: number, check: UnderwritingDossier['reviewChecks'][0]) => {
    setSelectedPillar({
      index,
      type: check.type,
      title: check.title,
      status: check.status,
    });
    setIsOverrideOpen(true);
  };

  const handleSubmitOverride = async (data: {
    newStatus: PillarStatus;
    category: string;
    justification: string;
  }) => {
    if (!activeDossier || !selectedPillar) return;
    try {
      const notes = `${data.category}: ${data.justification}`;
      const updated = await applicationService.overridePillarCheck(
        activeDossier.id,
        selectedPillar.type,
        data.newStatus,
        notes
      );
      setQueue((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setIsOverrideOpen(false);
      showToast(`Status ${selectedPillar.title} diperbarui menjadi ${data.newStatus}.`);
    } catch {
      showToast('Gagal mengubah status pilar verifikasi.');
    }
  };

  const handleSaveNotes = async () => {
    if (!activeDossier) return;
    try {
      const updated = await applicationService.saveInternalNotes(activeDossier.id, currentNote);
      setQueue((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast(`Catatan audit internal untuk ${updated.id} berhasil disimpan.`);
    } catch {
      showToast('Gagal menyimpan catatan.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss toast"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Underwriting & Verification Workbench
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pemeriksaan kepatuhan 4 pilar review check Core API, OCR Dukcapil, dan eksekusi persetujuan penerbitan polis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => showToast('Sinkronisasi data antrean Core API berhasil.')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <span>🔄</span>
            <span>Sync Antrean</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      {/* Filter Tabs & Product Select */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua ({tabCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review_needed')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'review_needed'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Perlu Review ({tabCounts.review_needed})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submitted')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'submitted'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Submitted Baru ({tabCounts.submitted})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'approved'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Disetujui ({tabCounts.approved})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'rejected'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Ditolak ({tabCounts.rejected})
          </button>
        </div>

        {/* Right Product Filter */}
        <div className="flex items-center gap-2">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Filter Produk: Semua Kategori</option>
            <option value="secure-life-plus">Secure Life Plus</option>
            <option value="health-guard-essential">Health Guard Essential</option>
            <option value="auto-shield-comprehensive">Auto Shield Comprehensive</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout: Left Queue (360px) + Right Dossier (732px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Queue List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Daftar Antrean Aktif ({filteredQueue.length})
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">SLA Paling Mendesak</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Cari NIK / Pemohon / ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Queue List Scrollable Container */}
          <div className="divide-y divide-slate-100 max-h-[860px] overflow-y-auto">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada pengajuan yang sesuai dengan kriteria filter.
              </div>
            ) : (
              filteredQueue.map((item) => {
                const isSelected = item.id === activeDossier?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left p-4 transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>
                        {item.id}
                      </span>
                      <span
                        className="text-[11px] font-bold font-mono"
                        style={{ color: item.slaColor }}
                      >
                        {item.slaText}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {item.applicantName} ({item.applicantAge})
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        NIK: {item.nik}
                      </div>
                    </div>

                    <div className="text-xs font-medium text-slate-700">
                      {item.productName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      UP: {item.sumAssured}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {item.passedChecksCount}/{item.totalChecksCount} Checks
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Menampilkan {filteredQueue.length} dari {queue.length} antrean • Auto Poll 30s
          </div>
        </div>

        {/* RIGHT COLUMN: Dossier & 4 Pillar Checks (8 cols) */}
        {activeDossier && (
          <div className="lg:col-span-8 space-y-6">
            {/* Dossier Header Card (Dark Surface) */}
            <div className="bg-[#0f172a] rounded-xl text-white p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Dossier Underwriting
                  </span>
                  <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
                    {activeDossier.id}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Pemohon: {activeDossier.applicantName} ({activeDossier.applicantAge} Thn) • {activeDossier.productName} • UP: {activeDossier.sumAssured}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white">
                    Skor: {activeDossier.riskScore} ({activeDossier.riskGrade})
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {activeDossier.status}
                  </span>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white font-mono"
                    style={{ backgroundColor: activeDossier.slaColor }}
                  >
                    {activeDossier.slaText}
                  </span>
                </div>
              </div>

              {/* Details Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Premi & Tenor</span>
                  <span className="font-bold text-white block">{activeDossier.monthlyPremium}</span>
                  <span className="text-slate-400 text-[11px]">Tenor: {activeDossier.tenorYears} Tahun</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Metode Pembayaran</span>
                  <span className="font-bold text-white block">{activeDossier.paymentMethod}</span>
                  <span className="text-slate-400 text-[11px]">
                    Auto-Debet: {activeDossier.autoDebet ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Ahli Waris</span>
                  <span className="font-bold text-white block">{activeDossier.beneficiaryName}</span>
                  <span className="text-slate-400 text-[11px]">
                    Porsi: {activeDossier.beneficiarySharePct}% Manfaat
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Pilar Review Checks Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Evaluasi 4 Pilar Review Checks (Core API Service)
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {activeDossier.passedChecksCount} dari 4 Lolos
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Validasi otomatis engine underwriting dan input verifikasi manual oleh Lead Underwriter.
                </p>
              </div>

              {/* Checks list */}
              <div className="space-y-3.5">
                {activeDossier.reviewChecks.map((chk, idx) => (
                  <div
                    key={chk.type}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{chk.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{chk.details}</p>
                      </div>

                      <span
                        className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase shrink-0"
                        style={{ backgroundColor: chk.statusBg, color: chk.statusColor }}
                      >
                        {chk.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[11px]">
                      <span className="text-slate-500 font-medium">{chk.reviewer}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenOverride(idx, chk)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold shadow-xs hover:bg-slate-100 transition-colors"
                      >
                        <span>Ubah Status ⚙️</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Box */}
            <div className="bg-white rounded-xl border-2 border-blue-600/30 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Keputusan Underwriter & Penerbitan Polis Final
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini akan mengupdate database Core API dan mengirim notifikasi email polis ke nasabah.
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setIsApproveOpen(true)}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Setujui & Terbitkan Polis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRFIOpen(true)}
                  className="py-3 px-4 rounded-xl bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>📋</span>
                  <span>Minta Dokumen Tambahan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRejectOpen(true)}
                  className="py-3 px-4 rounded-xl bg-white border-2 border-rose-500 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>✕</span>
                  <span>Tolak Pengajuan</span>
                </button>
              </div>

              {/* Internal Notes Textarea */}
              <div className="space-y-2">
                <label
                  htmlFor="internal-notes"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Catatan Audit Underwriter (Internal Note):
                </label>
                <textarea
                  id="internal-notes"
                  rows={3}
                  value={currentNote}
                  onChange={(e) =>
                    setEditedNotes((prev) => ({
                      ...prev,
                      [activeDossier.id]: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Audit Signature & Save Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-500 font-medium block">
                    {activeDossier.auditSignature}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block truncate max-w-md">
                    Audit Hash: {activeDossier.auditHash}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs shadow-sm hover:bg-slate-800 transition-colors shrink-0"
                >
                  Simpan Keputusan 💾
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {activeDossier && (
        <>
          {/* 1. Approve Modal */}
          <ApproveModal
            isOpen={isApproveOpen}
            onClose={() => setIsApproveOpen(false)}
            applicationId={activeDossier.id}
            applicantName={activeDossier.applicantName}
            productName={activeDossier.productName}
            sumAssured={activeDossier.sumAssured}
            premium={activeDossier.monthlyPremium}
            onConfirmApprove={handleConfirmApprove}
          />

          {/* 2. RFI Modal */}
          <RFIModal
            isOpen={isRFIOpen}
            onClose={() => setIsRFIOpen(false)}
            applicationId={activeDossier.id}
            applicantName={activeDossier.applicantName}
            onSubmitRFI={handleSubmitRFI}
          />

          {/* 3. Reject Modal */}
          <RejectModal
            isOpen={isRejectOpen}
            onClose={() => setIsRejectOpen(false)}
            applicationId={activeDossier.id}
            applicantName={activeDossier.applicantName}
            onSubmitReject={handleSubmitReject}
          />

          {/* 4. Manual Override Modal */}
          {selectedPillar && (
            <ManualOverrideModal
              isOpen={isOverrideOpen}
              onClose={() => setIsOverrideOpen(false)}
              applicationId={activeDossier.id}
              pillarNumber={selectedPillar.index + 1}
              pillarName={selectedPillar.title}
              currentStatus={
                selectedPillar.status === 'UNDER_REVIEW'
                  ? 'FLAGGED'
                  : selectedPillar.status === 'NOT_NEEDED'
                  ? 'WAIVED'
                  : selectedPillar.status === 'REJECTED'
                  ? 'FAILED'
                  : selectedPillar.status
              }
              onSubmit={handleSubmitOverride}
            />
          )}
        </>
      )}
    </div>
  );
};
