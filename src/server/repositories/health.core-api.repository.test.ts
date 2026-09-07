import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoreApiHealthRepository } from './health.core-api.repository';
import { SystemRepository } from './system.repository';

describe('CoreApiHealthRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to mock repository when baseUrl is not configured', async () => {
    const repo = new CoreApiHealthRepository('');
    const overview = await repo.getSystemOverview();

    expect(overview).toBeDefined();
    expect(overview.services.length).toBeGreaterThan(0);
    expect(overview.auditLogs.length).toBeGreaterThan(0);

    const services = await repo.pingServices();
    expect(services.length).toBeGreaterThan(0);

    const single = await repo.pingSingleService('service_core_api');
    expect(single).toBeDefined();
    expect(single?.name).toBe('Core API Backend (Go Fiber)');

    const logs = await repo.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);

    const log = await repo.getAuditLogById('aud_2026_0906_001');
    expect(log).toBeDefined();
    expect(log?.id).toBe('aud_2026_0906_001');
  });

  it('fetches and maps system overview successfully', async () => {
    const mockResponse = {
      data: {
        overall_status: 'online',
        active_services_count: 5,
        total_services_count: 5,
        avg_latency_ms: 18.5,
        services: [
          {
            id: 'service_core_api',
            name: 'Core API Backend (Go Fiber)',
            type: 'Core Microservice',
            endpoint: 'http://localhost:8080/health',
            status: 'online',
            latency_ms: 1.2,
            uptime_percentage: 99.98,
            last_checked: '2026-09-08T00:00:00Z',
          },
        ],
        database_stats: {
          open_connections: 12,
          in_use: 3,
          idle: 9,
          max_open_connections: 50,
        },
        recent_audit_logs: [
          {
            id: 'aud_1',
            timestamp: '2026-09-08T00:00:00Z',
            actor_name: 'Budi',
            actor_role: 'Underwriter',
            action: 'APPROVE',
            category: 'underwriting',
            target_resource: '#APP-1',
            ip_address: '192.168.1.1',
            status: 'SUCCESS',
            details: { note: 'ok' },
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const repo = new CoreApiHealthRepository('http://localhost:8080');
    const overview = await repo.getSystemOverview();

    expect(overview.overallStatus).toBe('online');
    expect(overview.activeServicesCount).toBe(5);
    expect(overview.totalServicesCount).toBe(5);
    expect(overview.avgLatencyMs).toBe(18.5);
    expect(overview.services).toHaveLength(1);
    expect(overview.services[0].id).toBe('service_core_api');
    expect(overview.auditLogs).toHaveLength(1);
    expect(overview.auditLogs[0].id).toBe('aud_1');
  });

  it('pings all services and passes service_id when requested', async () => {
    const mockServices = [
      {
        id: 'service_postgres',
        name: 'PostgreSQL',
        type: 'Database',
        endpoint: 'localhost:5432',
        status: 'online',
        latency_ms: 2.1,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockServices }),
    });

    const repo = new CoreApiHealthRepository('http://localhost:8080');
    const all = await repo.pingServices();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('service_postgres');

    const single = await repo.pingSingleService('service_postgres');
    expect(single).toBeDefined();
    expect(single?.id).toBe('service_postgres');
  });

  it('returns null when pinging with an empty service ID', async () => {
    const repo = new CoreApiHealthRepository('http://localhost:8080');
    const res = await repo.pingSingleService('  ');
    expect(res).toBeNull();
  });

  it('fetches audit logs with query parameters', async () => {
    const mockLogs = [
      {
        id: 'aud_1',
        timestamp: '2026-09-08T00:00:00Z',
        action: 'APPROVE',
        category: 'underwriting',
        status: 'SUCCESS',
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      expect(url).toContain('category=underwriting');
      expect(url).toContain('status=SUCCESS');
      expect(url).toContain('search=Budi');
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: mockLogs, total: 1 }),
      });
    });

    const repo = new CoreApiHealthRepository('http://localhost:8080');
    const logs = await repo.getAuditLogs('underwriting', 'SUCCESS', 'Budi');
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe('aud_1');
  });

  it('fetches single audit log by ID and handles 404 properly', async () => {
    const repo = new CoreApiHealthRepository('http://localhost:8080');

    // 1. Success case
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'aud_test',
          timestamp: '2026-09-08T00:00:00Z',
          action: 'CREATE',
          category: 'product',
          status: 'SUCCESS',
        },
      }),
    });

    const found = await repo.getAuditLogById('aud_test');
    expect(found).toBeDefined();
    expect(found?.id).toBe('aud_test');

    // 2. 404 case
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'audit log not found' }),
    });

    const notFound = await repo.getAuditLogById('missing_id');
    expect(notFound).toBeNull();

    // 3. Empty ID case
    const empty = await repo.getAuditLogById(' ');
    expect(empty).toBeNull();
  });

  it('falls back to mock repository on unexpected network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const repo = new CoreApiHealthRepository('http://localhost:8080');
    const overview = await repo.getSystemOverview();
    expect(overview).toBeDefined();
    expect(overview.services.length).toBeGreaterThan(0);

    const logs = await repo.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
  });
});
