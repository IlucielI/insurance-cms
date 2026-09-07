import { describe, it, expect } from 'vitest';
import {
  dashboardRepository,
  dashboardService,
  healthController,
  applicationRepository,
  applicationService,
  productRepository,
  productService,
  knowledgeService,
  healthAuditService,
} from './registry';
import { DashboardService } from '../services/dashboard.service';
import { HealthController } from '../controllers/health.controller';
import { ApplicationService } from '../services/application.service';
import { ProductService } from '../services/product.service';
import { KnowledgeService } from '../services/knowledge.service';
import { HealthAuditService } from '../services/health-audit.service';

describe('DI Registry', () => {
  it('should export initialized services and controller instances', () => {
    expect(dashboardRepository).toBeDefined();
    expect(dashboardService).toBeDefined();
    expect(dashboardService).toBeInstanceOf(DashboardService);
    expect(healthController).toBeDefined();
    expect(healthController).toBeInstanceOf(HealthController);
    expect(applicationRepository).toBeDefined();
    expect(applicationService).toBeDefined();
    expect(applicationService).toBeInstanceOf(ApplicationService);
    expect(productRepository).toBeDefined();
    expect(productService).toBeDefined();
    expect(productService).toBeInstanceOf(ProductService);
    expect(knowledgeService).toBeDefined();
    expect(knowledgeService).toBeInstanceOf(KnowledgeService);
    expect(healthAuditService).toBeDefined();
    expect(healthAuditService).toBeInstanceOf(HealthAuditService);
  });

  it('should allow services to successfully fetch data through injected mock repository', async () => {
    const data = await dashboardService.getOverview();
    expect(data).toBeDefined();
    expect(data.kpis).toBeDefined();
    expect(data.recentQueue.length).toBeGreaterThan(0);

    const products = await productService.getProducts();
    expect(products.length).toBeGreaterThan(0);
    const metrics = await productService.getProductMetrics();
    expect(metrics.totalProducts).toBeGreaterThan(0);

    const docs = await knowledgeService.getDocuments();
    expect(docs.length).toBeGreaterThan(0);
    const kMetrics = await knowledgeService.getMetrics();
    expect(kMetrics.totalDocuments).toBeGreaterThan(0);

    const healthSummary = await healthAuditService.getSystemOverview();
    expect(healthSummary.overallStatus).toBe('online');
    expect(healthSummary.services.length).toBeGreaterThan(0);
    expect(healthSummary.auditLogs.length).toBeGreaterThan(0);
  });
});
