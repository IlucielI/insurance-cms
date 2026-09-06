import { describe, it, expect, vi } from 'vitest';
import { DashboardService } from './dashboard.service';
import { IDashboardRepository, DashboardData } from '../repositories/dashboard.repository.interface';

describe('DashboardService', () => {
  it('should delegate getOverview call to dashboardRepository', async () => {
    const mockData: DashboardData = {
      kpis: {
        totalApplications: {
          title: 'Total',
          value: '100',
          trend: '+10%',
          trendDirection: 'up',
          subtitle: 'vs yesterday',
          icon: '📋',
          color: '#2563eb',
        },
        inReview: {
          title: 'Review',
          value: '10',
          trend: '15m',
          trendDirection: 'neutral',
          subtitle: 'current',
          icon: '⏳',
          color: '#f59e0b',
        },
        approvalRate: {
          title: 'Rate',
          value: '95%',
          trend: 'OK',
          trendDirection: 'up',
          subtitle: 'compliant',
          icon: '⚡',
          color: '#10b981',
        },
        activePolicies: {
          title: 'Active',
          value: '1.000',
          trend: 'Rp 5M',
          trendDirection: 'up',
          subtitle: 'GWP',
          icon: '🛡️',
          color: '#0f172a',
        },
      },
      recentQueue: [],
      slaDistribution: {
        averageSlaMinutes: 15,
        averageSlaText: '15 Menit',
        targetMinutes: 60,
        complianceRateText: '99%',
        statuses: [],
      },
      topProducts: [],
    };

    const mockRepo: IDashboardRepository = {
      getDashboardData: vi.fn().mockResolvedValue(mockData),
    };

    const service = new DashboardService(mockRepo);
    const result = await service.getOverview();

    expect(mockRepo.getDashboardData).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });
});
