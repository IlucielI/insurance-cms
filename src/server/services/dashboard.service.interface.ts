import { DashboardData } from '../repositories/dashboard.repository.interface';

export interface IDashboardService {
  getOverview(): Promise<DashboardData>;
}
