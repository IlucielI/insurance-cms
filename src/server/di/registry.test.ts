import { describe, it, expect } from 'vitest';
import { dashboardService, healthController } from './registry';
import { DashboardService } from '../services/dashboard.service';
import { HealthController } from '../controllers/health.controller';

describe('DI Registry', () => {
  it('should export initialized dashboardService and healthController instances', () => {
    expect(dashboardService).toBeDefined();
    expect(dashboardService).toBeInstanceOf(DashboardService);
    expect(healthController).toBeDefined();
    expect(healthController).toBeInstanceOf(HealthController);
  });

  it('should allow dashboardService to successfully fetch data through injected mock repository', async () => {
    const data = await dashboardService.getOverview();
    expect(data).toBeDefined();
    expect(data.kpis).toBeDefined();
    expect(data.recentQueue.length).toBeGreaterThan(0);
  });
});
