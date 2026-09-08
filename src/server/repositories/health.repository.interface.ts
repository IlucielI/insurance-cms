import { SystemMetadata } from './system.repository.interface';

export type ServiceHealthStatus = 'online' | 'degraded' | 'offline';

export type AuditSeverity = 'SUCCESS' | 'WARNING' | 'FAILED';

export interface ServiceHealthItem {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  status: ServiceHealthStatus;
  latencyMs: number;
  uptimePercentage: number;
  lastChecked: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  category: string;
  targetResource: string;
  ipAddress: string;
  status: AuditSeverity;
  details: Record<string, unknown>;
}

export interface ApiHealthMetadata {
  version: string;
  gitHash: string;
  uptime: string;
  uptimeFormatted: string;
  statusCode: number;
}

export interface SystemHealthOverview {
  cmsMetadata: SystemMetadata;
  overallStatus: ServiceHealthStatus;
  activeServicesCount: number;
  totalServicesCount: number;
  avgLatencyMs: number;
  services: ServiceHealthItem[];
  auditLogs: AuditLogEntry[];
  apiMetadata?: ApiHealthMetadata;
}

export interface IHealthRepository {
  getSystemOverview(): Promise<SystemHealthOverview>;
  pingServices(serviceId?: string): Promise<ServiceHealthItem[]>;
  pingSingleService(serviceId: string): Promise<ServiceHealthItem | null>;
  getAuditLogs(category?: string, status?: AuditSeverity, search?: string): Promise<AuditLogEntry[]>;
  getAuditLogById(id: string): Promise<AuditLogEntry | null>;
}
