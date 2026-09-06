import type {
  IHealthRepository,
  ServiceHealthItem,
  AuditLogEntry,
  AuditSeverity,
  SystemHealthOverview,
} from '../repositories/health.repository.interface';
import type { IHealthAuditService } from './health-audit.service.interface';

export class HealthAuditService implements IHealthAuditService {
  constructor(private readonly healthRepository: IHealthRepository) {}

  async getSystemOverview(): Promise<SystemHealthOverview> {
    return this.healthRepository.getSystemOverview();
  }

  async pingServices(serviceId?: string): Promise<ServiceHealthItem[]> {
    return this.healthRepository.pingServices(serviceId?.trim());
  }

  async pingSingleService(serviceId: string): Promise<ServiceHealthItem | null> {
    if (!serviceId || !serviceId.trim()) {
      return null;
    }
    return this.healthRepository.pingSingleService(serviceId.trim());
  }

  async getAuditLogs(
    category?: string,
    status?: AuditSeverity,
    search?: string
  ): Promise<AuditLogEntry[]> {
    const cleanedSearch = search?.trim();
    return this.healthRepository.getAuditLogs(category, status, cleanedSearch);
  }

  async getAuditLogById(id: string): Promise<AuditLogEntry | null> {
    if (!id || !id.trim()) {
      return null;
    }
    return this.healthRepository.getAuditLogById(id.trim());
  }
}
