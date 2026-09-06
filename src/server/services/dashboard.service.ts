import { IDashboardService } from './dashboard.service.interface';
import {
  IDashboardRepository,
  DashboardData,
} from '../repositories/dashboard.repository.interface';

export class DashboardService implements IDashboardService {
  constructor(private readonly dashboardRepository: IDashboardRepository) {}

  async getOverview(): Promise<DashboardData> {
    return this.dashboardRepository.getDashboardData();
  }
}
