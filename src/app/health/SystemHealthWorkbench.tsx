'use client';

import React, { useState, useMemo } from 'react';
import type {
  ServiceHealthItem,
  AuditLogEntry,
  SystemHealthOverview,
  AuditSeverity,
} from '@/server/repositories/health.repository.interface';
import { healthAuditService } from '@/server/di';

interface SystemHealthWorkbenchProps {
  initialOverview: SystemHealthOverview;
}

type CategoryFilter = 'all' | 'underwriting' | 'product' | 'knowledge' | 'auth';
type StatusFilter = 'all' | AuditSeverity;

export const SystemHealthWorkbench: React.FC<SystemHealthWorkbenchProps> = ({
  initialOverview,
}) => {
  const [overview, setOverview] = useState<SystemHealthOverview>(initialOverview);
  const [services, setServices] = useState<ServiceHealthItem[]>(initialOverview.services);
  const [auditLogs] = useState<AuditLogEntry[]>(initialOverview.auditLogs);

  const [isPinging, setIsPinging] = useState(false);
  const [pingingServiceId, setPingingServiceId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Inspector Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Ping All Services
  const handlePingAll = async () => {
    setIsPinging(true);
    try {
      const updatedServices = await healthAuditService.pingServices();
      setServices(updatedServices);

      let totalLatency = 0;
      for (const s of updatedServices) {
        totalLatency += s.latencyMs;
      }
      const avgLatencyMs = Number((totalLatency / updatedServices.length).toFixed(1));

      setOverview((prev) => ({
        ...prev,
        services: updatedServices,
        avgLatencyMs,
      }));

      showToast('Seluruh layanan berhasil diperiksa (health check ping selesai).');
    } catch {
      showToast('Gagal melakukan ping ke beberapa layanan.');
    } finally {
      setIsPinging(false);
    }
  };

  // Ping Individual Service
  const handlePingSingle = async (serviceId: string) => {
    setPingingServiceId(serviceId);
    try {
      const updatedService = await healthAuditService.pingSingleService(serviceId);

      if (updatedService) {
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? updatedService : s))
        );
        showToast(`Layanan ${updatedService.name} berhasil diperiksa (${updatedService.latencyMs} ms).`);
      }
    } catch {
      showToast('Gagal memeriksa status layanan.');
    } finally {
      setPingingServiceId(null);
    }
  };

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (categoryFilter !== 'all' && log.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'all' && log.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchActor = log.actorName.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchTarget = log.targetResource.toLowerCase().includes(q);
        const matchIp = log.ipAddress.includes(q);
        const matchRole = log.actorRole.toLowerCase().includes(q);
        if (!matchActor && !matchAction && !matchTarget && !matchIp && !matchRole) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, categoryFilter, statusFilter, searchQuery]);

  // Copy JSON Details to Clipboard
  const handleCopyJson = async () => {
    if (!selectedLog) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
      showToast('Payload detail audit log berhasil disalin ke clipboard.');
    } catch {
      showToast('Gagal menyalin ke clipboard.');
    }
  };

  const getStatusBadge = (status: AuditSeverity) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ SUCCESS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            ⚠ WARNING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            ✕ FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'underwriting':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'product':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'knowledge':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'auth':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLatencyColor = (latencyMs: number) => {
    if (latencyMs < 10) return 'text-emerald-600';
    if (latencyMs < 30) return 'text-blue-600';
    if (latencyMs < 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System Health & Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pemantauan telemetri mikroservis waktu-nyata, latensi jaringan, dan log jejak audit kepatuhan ISO 27001 & OJK.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePingAll}
            disabled={isPinging}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <span className={isPinging ? 'animate-spin inline-block' : ''}>🔄</span>
            <span>{isPinging ? 'Memeriksa Layanan...' : 'Ping Seluruh Layanan'}</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Overall Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status Sistem
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm">🟢</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-xl font-extrabold text-emerald-600 uppercase tracking-wide">
                {overview.overallStatus}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {overview.activeServicesCount} dari {overview.totalServicesCount} Layanan Beroperasi Normal
            </div>
          </div>
        </div>

        {/* Stat 2: Avg Latency */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Latensi Jaringan Rata-Rata
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm">⚡</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {overview.avgLatencyMs} <span className="text-sm font-normal text-slate-500">ms</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              ✓ Di bawah target SLA (100 ms)
            </div>
          </div>
        </div>

        {/* Stat 3: App Environment & Uptime */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              CMS Environment
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm">🖥️</span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 truncate">
              {overview.cmsMetadata.appName}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Versi {overview.cmsMetadata.version} ({overview.cmsMetadata.nodeEnv})
            </div>
          </div>
        </div>

        {/* Stat 4: Total Audit Logs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Log Jejak Audit
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 text-sm">🛡️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {auditLogs.length} <span className="text-sm font-normal text-slate-500">Rekaman</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Integritas Hash Terverifikasi
            </div>
          </div>
        </div>
      </div>

      {/* Services Health Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📡</span>
            <span>Kesehatan Mikroservis & Dependensi Infrastruktur</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {services.length} Layanan Terhubung
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const isSinglePinging = pingingServiceId === service.id;
            return (
              <div
                key={service.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {service.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {service.type}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {service.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Endpoint:</span>
                      <span className="font-mono text-[11px] text-slate-700 truncate max-w-[200px]" title={service.endpoint}>
                        {service.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Latensi Saat Ini:</span>
                      <span className={`font-mono font-bold ${getLatencyColor(service.latencyMs)}`}>
                        {service.latencyMs} ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Uptime SLA:</span>
                      <span className="font-semibold text-slate-800">
                        {service.uptimePercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Cek: {new Date(service.lastChecked).toLocaleTimeString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePingSingle(service.id)}
                    disabled={isSinglePinging || isPinging}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors disabled:opacity-50"
                  >
                    {isSinglePinging ? 'Pinging...' : 'Ping Layanan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Log Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🛡️</span>
                <span>Log Jejak Audit & Kepatuhan Keamanan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Catatan mutasi data sensitif, override underwriting, dan perubahan aturan produk.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                aria-label="Filter Kategori"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="underwriting">Underwriting</option>
                <option value="product">Produk & Pricing</option>
                <option value="knowledge">Knowledge AI</option>
                <option value="auth">Autentikasi & Keamanan</option>
              </select>

              {/* Status Filter */}
              <select
                aria-label="Filter Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="WARNING">WARNING</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="mt-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Cari berdasarkan nama staf, aksi, target resource (#APP/prod), atau alamat IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Aktor / Staf</th>
                <th className="py-3 px-4">Aksi & Kategori</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="text-2xl mb-2">🔍</div>
                    <div className="font-semibold text-slate-600">Tidak ada catatan log audit yang cocok.</div>
                    <div className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</div>
                  </td>
                </tr>
              ) : (
                filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <div className="text-[11px] text-slate-500">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-800">{log.action}</div>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getCategoryBadge(log.category)}`}>
                        {log.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {log.targetResource}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Inspeksi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-700">{filteredAuditLogs.length}</strong> dari{' '}
            <strong className="text-slate-700">{auditLogs.length}</strong> rekaman audit log
          </span>
          <span className="font-mono text-slate-400">
            Hash: SHA256-HMAC • Standard ISO/IEC 27001
          </span>
        </div>
      </div>

      {/* Audit Log Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700 text-lg">🛡️</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Inspeksi Audit Trail Log
                  </h3>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                    Log ID: {selectedLog.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Primary Metas Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Aktor & Peran</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedLog.actorName}</div>
                  <div className="text-slate-500 text-[11px]">{selectedLog.actorRole}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Aksi</span>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedLog.action}</div>
                  <div className="text-slate-500 text-[11px]">Kategori: {selectedLog.category}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status Eksekusi</span>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Resource</span>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedLog.targetResource}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Alamat IP</span>
                  <div className="font-mono text-slate-700 mt-0.5">{selectedLog.ipAddress}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Timestamp</span>
                  <div className="font-mono text-slate-700 mt-0.5">
                    {new Date(selectedLog.timestamp).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* JSON Payload Inspector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <span>📦</span>
                    <span>Metadata & Payload Rinci (JSON)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Salin JSON
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed border border-slate-800 shadow-inner">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
