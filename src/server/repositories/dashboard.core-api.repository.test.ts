import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoreApiDashboardRepository } from './dashboard.core-api.repository';

describe('CoreApiDashboardRepository', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches metrics and applications from Core API and formats into DashboardData', async () => {
    const mockMetrics = {
      data: {
        applications: {
          total: 1500,
          draft: 10,
          submitted: 50,
          under_review: 40,
          approved: 1300,
          rejected: 100,
          approval_rate: 92.8,
        },
        premiums: {
          total_written_premium: 9500000000,
          active_policies_count: 1300,
        },
        underwriting: {
          pending_review_count: 90,
          average_sla_minutes: 15.5,
          sla_target_minutes: 60,
          sla_compliance_rate: 98.2,
        },
        top_products: [
          {
            product_id: 'prod-1',
            product_slug: 'secure-life-plus',
            product_name: 'Secure Life Plus',
            category: 'life',
            active_policies_count: 700,
            total_premium: 5000000000,
            loss_ratio: 0.12,
          },
          {
            product_id: 'prod-2',
            product_slug: 'health-guard-essential',
            product_name: 'Health Guard Essential',
            category: 'health',
            active_policies_count: 400,
            total_premium: 3000000000,
            loss_ratio: 0.18,
          },
          {
            product_id: 'prod-3',
            product_slug: 'auto-shield-comprehensive',
            product_name: 'Auto Shield Comprehensive',
            category: 'vehicle',
            active_policies_count: 200,
            total_premium: 1500000000,
            loss_ratio: 0.25,
          },
        ],
      },
    };

    const mockApplications = {
      data: [
        {
          id: 'APP-2026-9901',
          full_name: 'Ahmad Fauzi',
          product: { name: 'Secure Life Plus', slug: 'secure-life-plus' },
          sum_assured: 500000000,
          status: 'under_review',
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: 'APP-2026-9902',
          full_name: 'Ratna Sari',
          product: { name: 'Health Guard Essential', slug: 'health-guard-essential' },
          sum_assured: 250000000,
          status: 'approved',
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ],
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/admin/metrics')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockMetrics),
        });
      }
      if (url.includes('/api/v1/applications')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApplications),
        });
      }
      return Promise.reject(new Error('Unknown URL: ' + url));
    });

    const repo = new CoreApiDashboardRepository('http://localhost:8080');
    const data = await repo.getDashboardData();

    // Check KPIs
    expect(data.kpis.totalApplications.value).toBe('1.500');
    expect(data.kpis.inReview.value).toBe('90');
    expect(data.kpis.approvalRate.value).toBe('92.8%');
    expect(data.kpis.activePolicies.value).toBe('1.300');
    expect(data.kpis.activePolicies.trend).toBe('IDR 9,50 Miliar');

    // Check Recent Queue
    expect(data.recentQueue.length).toBe(2);
    expect(data.recentQueue[0].id).toBe('#APP-2026-9901');
    expect(data.recentQueue[0].applicantName).toBe('Ahmad Fauzi');
    expect(data.recentQueue[0].status).toBe('under_review');
    expect(data.recentQueue[1].status).toBe('approved');
    expect(data.recentQueue[1].slaText).toBe('Selesai');

    // Check SLA Distribution
    expect(data.slaDistribution.averageSlaMinutes).toBe(15.5);
    expect(data.slaDistribution.averageSlaText).toBe('15.5 Menit');
    expect(data.slaDistribution.complianceRateText).toContain('98.2% Kepatuhan');
    expect(data.slaDistribution.statuses.length).toBe(4);

    // Check Top 3 Products
    expect(data.topProducts.length).toBe(3);
    expect(data.topProducts[0].name).toBe('Secure Life Plus');
    expect(data.topProducts[0].category).toBe('ASURANSI JIWA');
    expect(data.topProducts[0].rankBadge).toBe('🏆 #1 Kontributor');
    expect(data.topProducts[1].category).toBe('ASURANSI KESEHATAN');
    expect(data.topProducts[1].rankBadge).toBe('🥈 #2 Kontributor');
    expect(data.topProducts[2].category).toBe('ASURANSI KENDARAAN');
    expect(data.topProducts[2].rankBadge).toBe('🥉 #3 Kontributor');
  });

  it('falls back to mock repository when Core API fetch fails with network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const repo = new CoreApiDashboardRepository('http://localhost:8080');
    const data = await repo.getDashboardData();

    // Fallback data verification
    expect(data.kpis.totalApplications.value).toBe('1.284');
    expect(data.kpis.inReview.value).toBe('28');
    expect(data.recentQueue.length).toBe(5);
    expect(data.topProducts.length).toBe(3);
  });

  it('falls back to mock repository when Core API returns 500 Internal Server Error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const repo = new CoreApiDashboardRepository('http://localhost:8080');
    const data = await repo.getDashboardData();

    expect(data.kpis.totalApplications.value).toBe('1.284');
  });

  it('falls back to mock repository when baseUrl is empty', async () => {
    const repo = new CoreApiDashboardRepository('');
    const data = await repo.getDashboardData();

    expect(data.kpis.totalApplications.value).toBe('1.284');
  });
});
