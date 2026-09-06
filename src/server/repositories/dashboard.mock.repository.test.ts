import { describe, it, expect } from 'vitest';
import { DashboardMockRepository } from './dashboard.mock.repository';

describe('DashboardMockRepository', () => {
  it('should return dashboard data with all KPIs, recent queue, SLA distribution, and top products', async () => {
    const repository = new DashboardMockRepository();
    const data = await repository.getDashboardData();

    // Verify KPIs
    expect(data.kpis).toBeDefined();
    expect(data.kpis.totalApplications.value).toBe('1.284');
    expect(data.kpis.inReview.value).toBe('28');
    expect(data.kpis.approvalRate.value).toBe('94.2%');
    expect(data.kpis.activePolicies.value).toBe('1.142');

    // Verify Recent Queue
    expect(data.recentQueue).toHaveLength(5);
    expect(data.recentQueue[0].id).toBe('#APP-2026-8819');
    expect(data.recentQueue[0].applicantName).toBe('Budi Santoso');
    expect(data.recentQueue[0].status).toBe('under_review');
    expect(data.recentQueue[0].slaMinutesLeft).toBe(12);

    // Verify SLA Distribution
    expect(data.slaDistribution.averageSlaMinutes).toBe(18.4);
    expect(data.slaDistribution.averageSlaText).toBe('18.4 Menit');
    expect(data.slaDistribution.statuses).toHaveLength(4);
    expect(data.slaDistribution.statuses[0].label).toContain('Disetujui');
    expect(data.slaDistribution.statuses[0].percentage).toBe(88.9);

    // Verify Top Products
    expect(data.topProducts).toHaveLength(3);
    expect(data.topProducts[0].name).toBe('Secure Life Plus');
    expect(data.topProducts[0].volumeFormatted).toBe('Rp 4.25 Miliar');
    expect(data.topProducts[0].rank).toBe(1);
    expect(data.topProducts[1].name).toBe('Health Guard Essential');
    expect(data.topProducts[2].name).toBe('Auto Shield Comprehensive');
  });

  it('should return isolated cloned data that does not mutate internal state', async () => {
    const repository = new DashboardMockRepository();
    const data1 = await repository.getDashboardData();
    data1.recentQueue[0].applicantName = 'Modified Name';

    const data2 = await repository.getDashboardData();
    expect(data2.recentQueue[0].applicantName).toBe('Budi Santoso');
  });
});
