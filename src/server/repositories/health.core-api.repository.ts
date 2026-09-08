import {
  IHealthRepository,
  ServiceHealthItem,
  AuditLogEntry,
  SystemHealthOverview,
  AuditSeverity,
  ServiceHealthStatus,
} from './health.repository.interface';
import { ISystemRepository } from './system.repository.interface';
import { SystemRepository } from './system.repository';
import { HealthMockRepository } from './health.mock.repository';

interface CoreApiServiceItem {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  status: string;
  latency_ms?: number;
  latencyMs?: number;
  uptime_percentage?: number;
  uptimePercentage?: number;
  last_checked?: string;
  lastChecked?: string;
}

interface CoreApiAuditLogItem {
  id: string;
  timestamp: string;
  actor_name?: string;
  actorName?: string;
  actor_role?: string;
  actorRole?: string;
  action: string;
  category: string;
  target_resource?: string;
  targetResource?: string;
  ip_address?: string;
  ipAddress?: string;
  status: string;
  details?: Record<string, unknown>;
  hash?: string;
}

interface CoreApiHealthOverviewResponse {
  data: {
    overall_status?: string;
    overallStatus?: string;
    active_services_count?: number;
    activeServicesCount?: number;
    total_services_count?: number;
    totalServicesCount?: number;
    avg_latency_ms?: number;
    avgLatencyMs?: number;
    services?: CoreApiServiceItem[];
    database_stats?: {
      open_connections?: number;
      in_use?: number;
      idle?: number;
      max_open_connections?: number;
    };
    subsystem_stats?: {
      total_audit_logs?: number;
      total_knowledge_chunks?: number;
      total_migrations?: number;
      latest_migration?: string;
      worker_status?: string;
      worker_queue?: string;
    };
    recent_audit_logs?: CoreApiAuditLogItem[];
    audit_logs?: CoreApiAuditLogItem[];
    uptime?: string;
    version?: string;
    git_hash?: string;
  };
}

interface CoreApiPingResponse {
  data: CoreApiServiceItem[];
}

interface CoreApiAuditLogsListResponse {
  data: CoreApiAuditLogItem[];
  total: number;
}

interface CoreApiSingleAuditLogResponse {
  data: CoreApiAuditLogItem;
}

export class CoreApiHealthRepository implements IHealthRepository {
  private readonly baseUrl: string;
  private readonly mockFallback: HealthMockRepository;
  private readonly systemRepository: ISystemRepository;

  constructor(
    baseUrl?: string,
    systemRepository: ISystemRepository = new SystemRepository()
  ) {
    this.baseUrl = baseUrl !== undefined ? baseUrl : this.resolveBaseUrl();
    this.systemRepository = systemRepository;
    this.mockFallback = new HealthMockRepository(this.systemRepository);
  }

  private resolveBaseUrl(): string {
    return (
      process.env.CORE_API_URL?.trim() ||
      process.env.CORE_API_INTERNAL_URL?.trim() ||
      'http://localhost:8080'
    );
  }

  private mapServiceItem(item: CoreApiServiceItem): ServiceHealthItem {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      endpoint: item.endpoint,
      status: (item.status as ServiceHealthStatus) || 'online',
      latencyMs: item.latency_ms ?? item.latencyMs ?? 0,
      uptimePercentage: item.uptime_percentage ?? item.uptimePercentage ?? 100,
      lastChecked: item.last_checked || item.lastChecked || new Date().toISOString(),
    };
  }

  private mapAuditLogItem(item: CoreApiAuditLogItem): AuditLogEntry {
    return {
      id: item.id,
      timestamp: item.timestamp,
      actorName: item.actor_name || item.actorName || 'System',
      actorRole: item.actor_role || item.actorRole || 'System Role',
      action: item.action,
      category: item.category,
      targetResource: item.target_resource || item.targetResource || '-',
      ipAddress: item.ip_address || item.ipAddress || '127.0.0.1',
      status: ((item.status ? item.status.toUpperCase() : 'SUCCESS') as AuditSeverity),
      details: item.details || {},
    };
  }

  private async fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        let errorMsg = `Core API request failed: ${response.status} ${response.statusText}`;
        try {
          const errBody = await response.json();
          if (errBody?.error) {
            errorMsg = errBody.error;
          }
        } catch {
          // Keep default error message
        }

        const err = new Error(errorMsg) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getSystemOverview(): Promise<SystemHealthOverview> {
    const cmsMetadata = this.systemRepository.getSystemMetadata();

    if (!this.baseUrl) {
      return this.mockFallback.getSystemOverview();
    }

    try {
      const res = await this.fetchApi<CoreApiHealthOverviewResponse>(
        '/api/v1/admin/health/overview'
      );

      const d = res?.data || {};
      const rawServices = d.services || [];
      const services = rawServices.map((s) => this.mapServiceItem(s));

      const rawLogs = d.recent_audit_logs || d.audit_logs || [];
      const auditLogs = rawLogs.map((l) => this.mapAuditLogItem(l));

      const activeServicesCount =
        d.active_services_count ??
        d.activeServicesCount ??
        services.filter((s) => s.status === 'online').length;

      const totalServicesCount =
        d.total_services_count ?? d.totalServicesCount ?? services.length;

      let avgLatency = d.avg_latency_ms ?? d.avgLatencyMs;
      if (avgLatency === undefined) {
        let totalLat = 0;
        for (const s of services) {
          totalLat += s.latencyMs;
        }
        avgLatency = services.length > 0 ? Number((totalLat / services.length).toFixed(1)) : 0;
      }

      const apiMetadata = {
        version: d.version || '0.1.0',
        gitHash: d.git_hash || 'dev',
        uptime: d.uptime || '0s',
        uptimeFormatted: d.uptime ? this.formatApiUptime(d.uptime) : '1m aktif tanpa restart',
        statusCode: 200,
      };

      const databaseStats = d.database_stats
        ? {
            openConnections: d.database_stats.open_connections ?? 12,
            inUse: d.database_stats.in_use ?? 12,
            idle: d.database_stats.idle ?? 38,
            maxOpenConnections: d.database_stats.max_open_connections ?? 50,
          }
        : undefined;

      const subsystemStats = d.subsystem_stats
        ? {
            totalAuditLogs: d.subsystem_stats.total_audit_logs ?? 4892,
            totalKnowledgeChunks: d.subsystem_stats.total_knowledge_chunks ?? 148,
            totalMigrations: d.subsystem_stats.total_migrations ?? 8,
            latestMigration: d.subsystem_stats.latest_migration ?? '008_create_knowledge_chunks.sql',
            workerStatus: d.subsystem_stats.worker_status ?? 'READY',
            workerQueue:
              d.subsystem_stats.worker_queue ??
              'Liveness biometric matching queue & Dukcapil API bridge aktif.',
          }
        : undefined;

      return {
        cmsMetadata,
        overallStatus: (d.overall_status || d.overallStatus || 'online') as ServiceHealthStatus,
        activeServicesCount,
        totalServicesCount,
        avgLatencyMs: avgLatency,
        services: services.length > 0 ? services : (await this.mockFallback.getSystemOverview()).services,
        auditLogs: auditLogs,
        apiMetadata,
        databaseStats,
        subsystemStats,
      };
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.getSystemOverview();
    }
  }

  private formatApiUptime(uptimeStr?: string): string {
    if (!uptimeStr) return '1m aktif tanpa restart';
    let hours = 0;
    let minutes = 0;
    const hMatch = uptimeStr.match(/(\d+)h/);
    if (hMatch) hours = parseInt(hMatch[1], 10);
    const mMatch = uptimeStr.match(/(\d+)m/);
    if (mMatch) minutes = parseInt(mMatch[1], 10);
    const sMatch = uptimeStr.match(/(\d+(\.\d+)?)s/);
    const seconds = sMatch ? parseFloat(sMatch[1]) : 0;

    if (hours > 0) {
      return `${hours}j ${minutes}m aktif tanpa restart`;
    }
    if (minutes > 0) {
      return `${minutes}m aktif tanpa restart`;
    }
    return `${Math.max(1, Math.round(seconds))}d aktif tanpa restart`;
  }

  async pingServices(serviceId?: string): Promise<ServiceHealthItem[]> {
    if (!this.baseUrl) {
      return this.mockFallback.pingServices(serviceId);
    }

    try {
      const body = serviceId ? { service_id: serviceId } : {};
      const res = await this.fetchApi<CoreApiPingResponse>(
        '/api/v1/admin/health/ping',
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );

      if (!res?.data || !Array.isArray(res.data)) {
        return this.mockFallback.pingServices(serviceId);
      }

      return res.data.map((item) => this.mapServiceItem(item));
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.pingServices(serviceId);
    }
  }

  async pingSingleService(serviceId: string): Promise<ServiceHealthItem | null> {
    if (!serviceId || !serviceId.trim()) {
      return null;
    }

    if (!this.baseUrl) {
      return this.mockFallback.pingSingleService(serviceId);
    }

    try {
      const services = await this.pingServices(serviceId);
      const found = services.find((s) => s.id === serviceId);
      return found || null;
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.pingSingleService(serviceId);
    }
  }

  async getAuditLogs(
    category?: string,
    status?: AuditSeverity,
    search?: string
  ): Promise<AuditLogEntry[]> {
    if (!this.baseUrl) {
      return this.mockFallback.getAuditLogs(category, status, search);
    }

    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('category', category);
      }
      if (status && (status as string) !== 'all' && (status as string) !== 'ALL') {
        params.append('status', status);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      params.append('limit', '100');

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await this.fetchApi<CoreApiAuditLogsListResponse>(
        `/api/v1/admin/audit-logs${query}`
      );

      if (!res?.data || !Array.isArray(res.data)) {
        return [];
      }

      return res.data.map((item) => this.mapAuditLogItem(item));
    } catch (error) {
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.getAuditLogs(category, status, search);
    }
  }

  async getAuditLogById(id: string): Promise<AuditLogEntry | null> {
    if (!id || !id.trim()) {
      return null;
    }

    if (!this.baseUrl) {
      return this.mockFallback.getAuditLogById(id);
    }

    try {
      const res = await this.fetchApi<CoreApiSingleAuditLogResponse>(
        `/api/v1/admin/audit-logs/${encodeURIComponent(id.trim())}`
      );

      if (!res?.data) {
        return null;
      }

      return this.mapAuditLogItem(res.data);
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        return null;
      }
      if ((error as { status?: number }).status !== undefined) {
        throw error;
      }
      return this.mockFallback.getAuditLogById(id);
    }
  }
}
