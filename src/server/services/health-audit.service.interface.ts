import type {
  ServiceHealthItem,
  AuditLogEntry,
  AuditSeverity,
  SystemHealthOverview,
} from '../repositories/health.repository.interface';

export interface IHealthAuditService {
  getSystemOverview(): Promise<SystemHealthOverview>;
  pingServices(serviceId?: string): Promise<ServiceHealthItem[]>;
  pingSingleService(serviceId: string): Promise<ServiceHealthItem | null>;
  getAuditLogs(
    category?: string,
    status?: AuditSeverity,
    search?: string
  ): Promise<AuditLogEntry[]>;
  getAuditLogById(id: string): Promise<AuditLogEntry | null>;
}
