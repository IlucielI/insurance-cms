import { SystemRepository } from '../repositories/system.repository';
import { HealthService } from '../services/health.service';
import { HealthController } from '../controllers/health.controller';
import { DashboardMockRepository } from '../repositories/dashboard.mock.repository';
import { DashboardService } from '../services/dashboard.service';
import { ApplicationMockRepository } from '../repositories/application.mock.repository';
import { ApplicationService } from '../services/application.service';
import { ProductMockRepository } from '../repositories/product.mock.repository';
import { ProductService } from '../services/product.service';
import { KnowledgeMockRepository } from '../repositories/knowledge.mock.repository';
import { KnowledgeService } from '../services/knowledge.service';

const systemRepository = new SystemRepository();
const healthService = new HealthService(systemRepository);
export const healthController = new HealthController(healthService);

const dashboardRepository = new DashboardMockRepository();
export const dashboardService = new DashboardService(dashboardRepository);

const applicationRepository = new ApplicationMockRepository();
export const applicationService = new ApplicationService(applicationRepository);

const productRepository = new ProductMockRepository();
export const productService = new ProductService(productRepository);

const knowledgeRepository = new KnowledgeMockRepository();
export const knowledgeService = new KnowledgeService(knowledgeRepository);
