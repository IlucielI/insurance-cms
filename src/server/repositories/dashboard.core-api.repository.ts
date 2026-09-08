import {
  IDashboardRepository,
  DashboardData,
  DashboardKpis,
  RecentQueueItem,
  SlaDistribution,
  TopProductContributor,
} from './dashboard.repository.interface';
import { DashboardMockRepository } from './dashboard.mock.repository';

interface CoreApiMetricsResponse {
  data: {
    applications: {
      total: number;
      draft: number;
      submitted: number;
      under_review: number;
      approved: number;
      rejected: number;
      approval_rate: number;
    };
    premiums: {
      total_written_premium: number;
      active_policies_count: number;
    };
    underwriting: {
      pending_review_count: number;
      average_sla_minutes: number;
      sla_target_minutes: number;
      sla_compliance_rate: number;
    };
    top_products: Array<{
      product_id: string;
      product_slug: string;
      product_name: string;
      category: string;
      active_policies_count: number;
      total_premium: number;
      loss_ratio: number;
    }>;
  };
}

interface CoreApiApplicationItem {
  id: string;
  product_id?: string;
  product?: {
    id?: string;
    name: string;
    slug: string;
  };
  full_name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  sum_assured: number;
  premium?: number;
  status: string;
  created_at: string;
}

interface CoreApiApplicationsListResponse {
  data: CoreApiApplicationItem[];
}

export class CoreApiDashboardRepository implements IDashboardRepository {
  private readonly baseUrl: string;
  private readonly mockFallback: DashboardMockRepository;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl !== undefined ? baseUrl : this.resolveBaseUrl();
    this.mockFallback = new DashboardMockRepository();
  }

  private resolveBaseUrl(): string {
    return (
      process.env.CORE_API_URL?.trim() ||
      process.env.CORE_API_INTERNAL_URL?.trim() ||
      'http://localhost:8080'
    );
  }

  private formatNumber(num: number): string {
    return new Intl.NumberFormat('id-ID').format(num);
  }

  private formatVolume(amount: number): string {
    if (amount >= 1_000_000_000) {
      const billions = (amount / 1_000_000_000).toFixed(2).replace('.', ',');
      return `Rp ${billions} Miliar`;
    }
    if (amount >= 1_000_000) {
      const millions = (amount / 1_000_000).toFixed(1).replace('.', ',');
      return `Rp ${millions} Juta`;
    }
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
  }

  private formatSumAssured(amount: number): string {
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
  }

  async getDashboardData(): Promise<DashboardData> {
    if (!this.baseUrl) {
      return this.mockFallback.getDashboardData();
    }

    try {
      // 1. Fetch Admin Metrics & Recent Applications in parallel
      const [metricsRes, appsRes] = await Promise.all([
        fetch(`${this.baseUrl}/api/v1/admin/metrics`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        }),
        fetch(`${this.baseUrl}/api/v1/applications?limit=5`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        }),
      ]);

      if (!metricsRes.ok) {
        console.warn(
          `[CoreApiDashboardRepository] Failed to fetch metrics: ${metricsRes.status}, falling back to mock`
        );
        return this.mockFallback.getDashboardData();
      }

      const metricsJson: CoreApiMetricsResponse = await metricsRes.json();
      const metrics = metricsJson.data;

      let recentApps: CoreApiApplicationItem[] = [];
      if (appsRes.ok) {
        const appsJson: CoreApiApplicationsListResponse = await appsRes.json();
        recentApps = appsJson.data || [];
      }

      // 2. Map KPIs
      const totalWrittenPremFormatted = this.formatVolume(metrics.premiums.total_written_premium);
      const kpis: DashboardKpis = {
        totalApplications: {
          title: 'Total Pengajuan Masuk',
          value: this.formatNumber(metrics.applications.total),
          trend: '+14.8% bln ini',
          trendDirection: 'up',
          subtitle: '',
          note: '85% Target kuartal 3',
          icon: '📋',
          color: '#2563eb',
        },
        inReview: {
          title: 'Dalam Review Underwriting',
          value: this.formatNumber(metrics.underwriting.pending_review_count),
          trend: `Avg SLA: ${metrics.underwriting.average_sla_minutes.toFixed(1)} min`,
          trendDirection: 'neutral',
          subtitle: '',
          note: 'Mendekati batas SLA: < 60m',
          icon: '⏳',
          color: '#f59e0b',
        },
        approvalRate: {
          title: 'Approval Rate Otomatis',
          value: `${metrics.applications.approval_rate.toFixed(1)}%`,
          trend: 'SLA Compliant',
          trendDirection: 'up',
          subtitle: '',
          note: 'Dukcapil OCR instant pass',
          icon: '⚡',
          color: '#10b981',
        },
        activePolicies: {
          title: 'Polis Aktif Diterbitkan',
          value: this.formatNumber(metrics.premiums.active_policies_count),
          trend: totalWrittenPremFormatted.replace('Rp ', 'IDR '),
          trendDirection: 'up',
          subtitle: '',
          note: 'Gross Written Premium',
          icon: '🛡️',
          color: '#0f172a',
        },
      };

      // 3. Map Recent Queue Table
      let recentQueue: RecentQueueItem[] = [];
      if (recentApps.length > 0) {
        recentQueue = recentApps.map((app) => {
          let status: RecentQueueItem['status'] = 'under_review';
          let statusLabel = 'Under Review';

          switch (app.status) {
            case 'submitted':
              status = 'submitted';
              statusLabel = 'Submitted';
              break;
            case 'approved':
              status = 'approved';
              statusLabel = 'Approved';
              break;
            case 'rejected':
              status = 'rejected';
              statusLabel = 'Rejected';
              break;
            case 'rfi_requested':
              status = 'rfi_requested';
              statusLabel = 'RFI Sent';
              break;
            default:
              status = 'under_review';
              statusLabel = 'Under Review';
          }

          // Calculate SLA minutes left based on 60 min target
          const createdTime = new Date(app.created_at).getTime();
          const elapsedMinutes = Math.floor((Date.now() - createdTime) / (60 * 1000));
          const minutesLeft = Math.max(0, 60 - elapsedMinutes);

          return {
            id: app.id.startsWith('#') ? app.id : `#${app.id}`,
            applicantName: app.full_name,
            nik: '3271048801920002', // fallback display NIK format
            productName: app.product?.name || 'Proteksi Bayu Life',
            sumAssured: this.formatSumAssured(app.sum_assured || 500000000),
            status,
            statusLabel,
            slaMinutesLeft: status === 'approved' ? 0 : minutesLeft,
            slaText: status === 'approved' ? 'Selesai' : `${minutesLeft} min left`,
          };
        });
      }

      // 4. Map SLA Distribution & Statuses
      const totalApps = metrics.applications.total;
      const pctApproved = totalApps > 0 ? Number(((metrics.applications.approved / totalApps) * 100).toFixed(1)) : 0;
      const pctUnderReview = totalApps > 0 ? Number(((metrics.applications.under_review / totalApps) * 100).toFixed(1)) : 0;
      const pctSubmitted = totalApps > 0 ? Number(((metrics.applications.submitted / totalApps) * 100).toFixed(1)) : 0;
      const pctRejected = totalApps > 0 ? Number(((metrics.applications.rejected / totalApps) * 100).toFixed(1)) : 0;

      const slaDistribution: SlaDistribution = {
        averageSlaMinutes: metrics.underwriting.average_sla_minutes,
        averageSlaText: `${metrics.underwriting.average_sla_minutes.toFixed(1)} Menit`,
        targetMinutes: metrics.underwriting.sla_target_minutes || 60,
        complianceRateText: `Target batas: < ${metrics.underwriting.sla_target_minutes || 60} Menit (${metrics.underwriting.sla_compliance_rate.toFixed(1)}% Kepatuhan)`,
        statuses: [
          {
            label: 'Disetujui (Approved)',
            countText: `${this.formatNumber(metrics.applications.approved)} (${pctApproved}%)`,
            percentage: pctApproved,
            color: '#10b981',
          },
          {
            label: 'Dalam Review (Under Review)',
            countText: `${this.formatNumber(metrics.applications.under_review)} (${pctUnderReview}%)`,
            percentage: pctUnderReview,
            color: '#f59e0b',
          },
          {
            label: 'Pengajuan Baru (Submitted)',
            countText: `${this.formatNumber(metrics.applications.submitted)} (${pctSubmitted}%)`,
            percentage: pctSubmitted,
            color: '#2563eb',
          },
          {
            label: 'Ditolak / Dokumen Kurang',
            countText: `${this.formatNumber(metrics.applications.rejected)} (${pctRejected}%)`,
            percentage: pctRejected,
            color: '#ef4444',
          },
        ],
      };

      // 5. Map Top 3 Products
      let topProducts: TopProductContributor[] = [];
      if (metrics.top_products && metrics.top_products.length > 0) {
        topProducts = metrics.top_products.slice(0, 3).map((tp, idx) => {
          const rank = idx + 1;
          let rankBadge = `🏆 #${rank} Kontributor`;
          let rankBadgeBg = 'bg-amber-100 border border-amber-300';
          let rankBadgeColor = 'text-amber-800';

          if (rank === 2) {
            rankBadge = `🥈 #${rank} Kontributor`;
            rankBadgeBg = 'bg-slate-100 border border-slate-300';
            rankBadgeColor = 'text-slate-700';
          } else if (rank === 3) {
            rankBadge = `🥉 #${rank} Kontributor`;
            rankBadgeBg = 'bg-orange-100 border border-orange-300';
            rankBadgeColor = 'text-orange-800';
          }

          let category = 'ASURANSI JIWA';
          let categoryColor = 'text-purple-600';
          switch (tp.category?.toLowerCase()) {
            case 'health':
              category = 'ASURANSI KESEHATAN';
              categoryColor = 'text-blue-600';
              break;
            case 'vehicle':
              category = 'ASURANSI KENDARAAN';
              categoryColor = 'text-emerald-600';
              break;
            case 'life':
            default:
              category = 'ASURANSI JIWA';
              categoryColor = 'text-purple-600';
              break;
          }

          const lossRatioPct = (tp.loss_ratio * 100).toFixed(1);
          return {
            rank,
            rankBadge,
            rankBadgeBg,
            rankBadgeColor,
            category,
            categoryColor,
            name: tp.product_name,
            volumeFormatted: this.formatVolume(tp.total_premium),
            activePoliciesCount: tp.active_policies_count,
            lossRatioText: `${lossRatioPct}% Klaim`,
            lossRatioStatus: tp.loss_ratio <= 0.2 ? '(Sehat)' : '(Normal)',
            lossRatioColor: tp.loss_ratio <= 0.2 ? 'text-emerald-600' : 'text-amber-600',
            slug: tp.product_slug,
          };
        });
      }

      return {
        kpis,
        recentQueue,
        slaDistribution,
        topProducts,
      };
    } catch (err: unknown) {
      console.warn(
        '[CoreApiDashboardRepository] Core API fetch failed, falling back to mock data:',
        err
      );
      return this.mockFallback.getDashboardData();
    }
  }
}
