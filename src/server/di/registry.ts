import { SystemRepository } from '../repositories/system.repository';
import { HealthService } from '../services/health.service';
import { HealthController } from '../controllers/health.controller';
import { DashboardMockRepository } from '../repositories/dashboard.mock.repository';
import { CoreApiDashboardRepository } from '../repositories/dashboard.core-api.repository';
import { DashboardService } from '../services/dashboard.service';
import { ApplicationMockRepository } from '../repositories/application.mock.repository';
import { CoreApiApplicationRepository } from '../repositories/application.core-api.repository';
import { ApplicationService } from '../services/application.service';
import { ProductMockRepository } from '../repositories/product.mock.repository';
import { CoreApiProductRepository } from '../repositories/product.core-api.repository';
import { ProductService } from '../services/product.service';
import { KnowledgeMockRepository } from '../repositories/knowledge.mock.repository';
import { KnowledgeService } from '../services/knowledge.service';
import { HealthMockRepository } from '../repositories/health.mock.repository';
import { HealthAuditService } from '../services/health-audit.service';

const systemRepository = new SystemRepository();
const healthService = new HealthService(systemRepository);
export const healthController = new HealthController(healthService);

const useMock =
  process.env.MOCK_CORE_API === 'true' ||
  process.env.NEXT_PUBLIC_MOCK_CORE_API === 'true' ||
  process.env.USE_MOCK_DATA === 'true';

export const dashboardRepository = useMock
  ? new DashboardMockRepository()
  : new CoreApiDashboardRepository();
export const dashboardService = new DashboardService(dashboardRepository);

export const applicationRepository = useMock
  ? new ApplicationMockRepository()
  : new CoreApiApplicationRepository();
export const applicationService = new ApplicationService(applicationRepository);

export const productRepository = useMock
  ? new ProductMockRepository()
  : new CoreApiProductRepository();
export const productService = new ProductService(productRepository);

const knowledgeRepository = new KnowledgeMockRepository();
export const knowledgeService = new KnowledgeService(knowledgeRepository);

const healthAuditRepository = new HealthMockRepository();
export const healthAuditService = new HealthAuditService(healthAuditRepository);

