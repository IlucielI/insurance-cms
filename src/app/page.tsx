import React from 'react';
import Link from 'next/link';
import { CMSLayout } from '@/components/templates/CMSLayout';
import { StatCard } from '@/components/molecules/StatCard';
import { StatusPill } from '@/components/molecules/StatusPill';
import { dashboardService } from '@/server/di';

export default async function HomePage() {
  const data = await dashboardService.getOverview();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <CMSLayout pageTitle="Executive Dashboard" currentPath="/">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Executive Underwriting Dashboard
              </h1>
              <StatusPill label="Core API v1.2.0 • Live" status="online" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Monitoring performa underwriting, SLA persetujuan polis, dan status integrasi Core API secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>📥</span>
              <span>Unduh Audit Log</span>
            </button>
          </div>
        </div>

        {/* Row 1: 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title={data.kpis.totalApplications.title}
            value={data.kpis.totalApplications.value}
            subtitle={data.kpis.totalApplications.note}
            trend={{
              value: data.kpis.totalApplications.trend,
              direction: data.kpis.totalApplications.trendDirection,
              label: data.kpis.totalApplications.subtitle,
            }}
            icon={<span className="text-xl">📋</span>}
            iconBgColor="bg-blue-50 text-blue-600"
          />

          <StatCard
            title={data.kpis.inReview.title}
            value={data.kpis.inReview.value}
            subtitle={data.kpis.inReview.note}
            trend={{
              value: data.kpis.inReview.trend,
              direction: data.kpis.inReview.trendDirection,
              label: data.kpis.inReview.subtitle,
            }}
            icon={<span className="text-xl">⏳</span>}
            iconBgColor="bg-amber-50 text-amber-600"
          />

          <StatCard
            title={data.kpis.approvalRate.title}
            value={data.kpis.approvalRate.value}
            subtitle={data.kpis.approvalRate.note}
            trend={{
              value: data.kpis.approvalRate.trend,
              direction: data.kpis.approvalRate.trendDirection,
              label: data.kpis.approvalRate.subtitle,
            }}
            icon={<span className="text-xl">⚡</span>}
            iconBgColor="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title={data.kpis.activePolicies.title}
            value={data.kpis.activePolicies.value}
            subtitle={data.kpis.activePolicies.note}
            trend={{
              value: data.kpis.activePolicies.trend,
              direction: data.kpis.activePolicies.trendDirection,
              label: data.kpis.activePolicies.subtitle,
            }}
            icon={<span className="text-xl">🛡️</span>}
            iconBgColor="bg-slate-100 text-slate-800"
          />
        </div>

        {/* Row 2: Recent Review Queue (Left 65%) & Distribution / SLA (Right 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Recent Applications Queue */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Antrean Review Aplikasi Perlu Tindakan
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aplikasi dengan flag review manual atau verifikasi dokumen lanjutan.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                    Semua (28)
                  </span>
                  <Link
                    href="/queue"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Buka ↗
                  </Link>
                </div>
              </div>

              {/* Table List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">No. Aplikasi</th>
                      <th className="py-3 px-4">Pemohon & NIK</th>
                      <th className="py-3 px-4">Produk</th>
                      <th className="py-3 px-4">UP (Limit)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentQueue.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-blue-600 block">{row.id}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            SLA: {row.slaText}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{row.applicantName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            NIK: {row.nik.substring(0, 8)}***
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {row.productName}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                          {row.sumAssured}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                              row.status
                            )}`}
                          >
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/queue?id=${row.id}`}
                            className="inline-flex items-center px-2.5 py-1 rounded bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors"
                          >
                            Buka
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Menampilkan 5 dari 28 antrean • Auto-refresh via WebSocket Core API</span>
            </div>
          </div>

          {/* Right Column: Status Distribution & SLA Card */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Status Polis & SLA Kepatuhan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Metrik penyelesaian review underwriting kuartal ini.
                </p>
              </div>

              {/* Highlight Box SLA */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">
                  SLA Rata-Rata Penyelesaian
                </span>
                <span className="text-3xl font-extrabold text-emerald-600 font-mono tracking-tight block mt-1">
                  {data.slaDistribution.averageSlaText}
                </span>
                <span className="text-[11px] text-slate-500 mt-2 block font-medium">
                  {data.slaDistribution.complianceRateText}
                </span>
              </div>

              {/* Status Progress Bars */}
              <div className="space-y-4 pt-1">
                {data.slaDistribution.statuses.map((st) => (
                  <div key={st.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{st.label}</span>
                      <span className="font-mono text-slate-500 font-medium">{st.countText}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${st.percentage}%`,
                          backgroundColor: st.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-400">
              Review otomatis didukung integrasi pgvector AI & OCR Dukcapil.
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase">
                Top 3 Performa Produk (Volume Premi Tertinggi)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Peringkat 3 produk kontributor terbesar dari total premi aktif (Rp 8.42 Miliar). Diperbarui real-time via Core API.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors self-start sm:self-auto"
            >
              Kelola Produk di CMS 03 →
            </Link>
          </div>

          {/* 3 Clean Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.topProducts.map((prod) => (
              <div
                key={prod.slug}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div>
                  {/* Top Bar: Category & Rank Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-extrabold tracking-wider ${prod.categoryColor}`}>
                      {prod.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${prod.rankBadgeBg} ${prod.rankBadgeColor}`}
                    >
                      {prod.rankBadge}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {prod.name}
                  </h3>

                  {/* Stat Box */}
                  <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                        Volume Premi Terbit
                      </span>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {prod.volumeFormatted}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                        Polis Terbit
                      </span>
                      <span className="text-sm font-bold text-slate-800 font-mono">
                        {prod.activePoliciesCount} Polis Aktif
                      </span>
                    </div>
                  </div>

                  {/* Loss Ratio Tag */}
                  <div className="mt-3.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Loss Ratio (Rasio Klaim):</span>
                    <span className={`font-bold ${prod.lossRatioColor}`}>
                      {prod.lossRatioText} {prod.lossRatioStatus}
                    </span>
                  </div>
                </div>

                {/* Bottom CTA Action */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Link
                    href={`/products?edit=${prod.slug}`}
                    className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Konfigurasi Pricing Rules ⚙️</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-slate-200/70 text-center text-xs text-slate-400">
          Bayu Insurance Core CMS • PostgreSQL 16 • Go Fiber Core API v1.2.0 • Antigravity Standard Compliance
        </div>
      </div>
    </CMSLayout>
  );
}
