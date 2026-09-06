import { SystemRepository } from '../repositories/system.repository';
import { HealthService } from '../services/health.service';
import { HealthController } from '../controllers/health.controller';
import { DashboardMockRepository } from '../repositories/dashboard.mock.repository';
import { DashboardService } from '../services/dashboard.service';
import { ApplicationMockRepository } from '../repositories/application.mock.repository';
import { ApplicationService } from '../services/application.service';

const systemRepository = new SystemRepository();
const healthService = new HealthService(systemRepository);
export const healthController = new HealthController(healthService);

const dashboardRepository = new DashboardMockRepository();
export const dashboardService = new DashboardService(dashboardRepository);

const applicationRepository = new ApplicationMockRepository();
export const applicationService = new ApplicationService(applicationRepository);
