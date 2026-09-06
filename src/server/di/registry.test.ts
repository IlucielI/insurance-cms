import {
  dashboardService,
  healthController,
  applicationService,
  productService,
  knowledgeService,
} from './registry';
import { DashboardService } from '../services/dashboard.service';
import { HealthController } from '../controllers/health.controller';
import { ApplicationService } from '../services/application.service';
import { ProductService } from '../services/product.service';
import { KnowledgeService } from '../services/knowledge.service';

describe('DI Registry', () => {
  it('should export initialized services and controller instances', () => {
    expect(dashboardService).toBeDefined();
    expect(dashboardService).toBeInstanceOf(DashboardService);
    expect(healthController).toBeDefined();
    expect(healthController).toBeInstanceOf(HealthController);
    expect(applicationService).toBeDefined();
    expect(applicationService).toBeInstanceOf(ApplicationService);
    expect(productService).toBeDefined();
    expect(productService).toBeInstanceOf(ProductService);
    expect(knowledgeService).toBeDefined();
    expect(knowledgeService).toBeInstanceOf(KnowledgeService);
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
  });
});
