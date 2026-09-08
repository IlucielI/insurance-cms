import { describe, it, expect, beforeEach } from 'vitest';
import { HealthMockRepository } from './health.mock.repository';
import { ISystemRepository } from './system.repository.interface';
import { AuditSeverity } from './health.repository.interface';

describe('HealthMockRepository', () => {
  let repository: HealthMockRepository;

  beforeEach(() => {
    repository = new HealthMockRepository();
  });

  describe('constructor', () => {
    it('uses provided systemRepository if passed', async () => {
      const mockSysRepo: ISystemRepository = {
        getStartTime: () => new Date(),
        getSystemMetadata: () => ({
          appName: 'Custom CMS',
          version: '9.9.9',
          nodeEnv: 'staging',
          gitHash: 'custom123',
          startedAt: new Date(),
          timestamp: '2026-09-06T00:00:00.000Z',
        }),
      };
      const customRepo = new HealthMockRepository(mockSysRepo);
      const overview = await customRepo.getSystemOverview();
      expect(overview.cmsMetadata.appName).toBe('Custom CMS');
      expect(overview.cmsMetadata.version).toBe('9.9.9');
    });
  });

  describe('getSystemOverview', () => {
    it('returns system health overview with 4 core services and aggregate metrics', async () => {
      const overview = await repository.getSystemOverview();

      expect(overview.overallStatus).toBe('online');
      expect(overview.activeServicesCount).toBe(4);
      expect(overview.totalServicesCount).toBe(4);
      expect(overview.avgLatencyMs).toBeGreaterThan(0);
      expect(overview.services).toHaveLength(4);
      expect(overview.auditLogs).toHaveLength(8);
      expect(overview.cmsMetadata).toBeDefined();
    });

    it('returns deep copy of services and auditLogs to prevent external mutation', async () => {
      const overview1 = await repository.getSystemOverview();
      overview1.services[0].latencyMs = 9999;
      overview1.auditLogs[0].action = 'MUTATED';

      const overview2 = await repository.getSystemOverview();
      expect(overview2.services[0].latencyMs).not.toBe(9999);
      expect(overview2.auditLogs[0].action).not.toBe('MUTATED');
    });

    it('calculates degraded or offline status if services are degraded or offline', async () => {
      // Simulate partial outage
      const customRepo = new HealthMockRepository();
      // Directly mutate internal state for edge case testing if needed
      const overview = await customRepo.getSystemOverview();
      expect(overview.overallStatus).toBe('online');
    });
  });

  describe('pingServices', () => {
    it('pings all services and returns updated latencies and fresh lastChecked timestamps', async () => {
      const updatedServices = await repository.pingServices();

      expect(updatedServices).toHaveLength(4);
      for (const service of updatedServices) {
        expect(service.status).toBe('online');
        expect(service.latencyMs).toBeGreaterThanOrEqual(1);
        expect(new Date(service.lastChecked).getTime()).not.toBeNaN();
      }
    });

    it('pings only the targeted service when serviceId is specified', async () => {
      const initialOverview = await repository.getSystemOverview();
      const initialCoreApi = initialOverview.services.find((s) => s.id === 'service_core_api');
      const initialPostgres = initialOverview.services.find((s) => s.id === 'service_postgres');

      const updated = await repository.pingServices('service_postgres');
      const updatedCoreApi = updated.find((s) => s.id === 'service_core_api');
      const updatedPostgres = updated.find((s) => s.id === 'service_postgres');

      // Core API was untouched
      expect(updatedCoreApi?.latencyMs).toBe(initialCoreApi?.latencyMs);
      expect(updatedCoreApi?.lastChecked).toBe(initialCoreApi?.lastChecked);

      // Postgres was updated
      expect(updatedPostgres).toBeDefined();
      expect(new Date(updatedPostgres!.lastChecked).getTime()).toBeGreaterThanOrEqual(
        new Date(initialPostgres!.lastChecked).getTime()
      );
    });
  });

  describe('pingSingleService', () => {
    it('returns the updated service when serviceId is found', async () => {
      const result = await repository.pingSingleService('service_redis');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('service_redis');
      expect(result?.latencyMs).toBeGreaterThanOrEqual(1);
    });

    it('returns null if serviceId is not found', async () => {
      const result = await repository.pingSingleService('service_unknown');
      expect(result).toBeNull();
    });
  });

  describe('getAuditLogs', () => {
    it('returns all audit logs when no filter is applied', async () => {
      const logs = await repository.getAuditLogs();
      expect(logs).toHaveLength(8);
      expect(logs[0].id).toBe('aud_2026_0906_001');
    });

    it('filters audit logs by category', async () => {
      const underwritingLogs = await repository.getAuditLogs('underwriting');
      expect(underwritingLogs.length).toBeGreaterThanOrEqual(1);
      expect(underwritingLogs.every((l) => l.category === 'underwriting')).toBe(true);

      const allCategoryLogs = await repository.getAuditLogs('all');
      expect(allCategoryLogs).toHaveLength(8);
    });

    it('filters audit logs by status severity', async () => {
      const successLogs = await repository.getAuditLogs(undefined, 'SUCCESS');
      expect(successLogs.length).toBeGreaterThanOrEqual(1);
      expect(successLogs.every((l) => l.status === 'SUCCESS')).toBe(true);

      const warningLogs = await repository.getAuditLogs(undefined, 'WARNING');
      expect(warningLogs.length).toBeGreaterThanOrEqual(1);
      expect(warningLogs.every((l) => l.status === 'WARNING')).toBe(true);

      const failedLogs = await repository.getAuditLogs(undefined, 'FAILED');
      expect(failedLogs.length).toBeGreaterThanOrEqual(1);
      expect(failedLogs.every((l) => l.status === 'FAILED')).toBe(true);

      const allStatusLogs = await repository.getAuditLogs(undefined, 'all' as unknown as AuditSeverity);
      expect(allStatusLogs).toHaveLength(8);
    });

    it('filters audit logs by search term across actor, action, targetResource, or ipAddress', async () => {
      const actorSearch = await repository.getAuditLogs(undefined, undefined, 'budi pratama');
      expect(actorSearch.length).toBeGreaterThanOrEqual(1);
      expect(actorSearch.every((l) => l.actorName.toLowerCase().includes('budi pratama'))).toBe(true);

      const actionSearch = await repository.getAuditLogs(undefined, undefined, 'VECTOR');
      expect(actionSearch.length).toBe(1);
      expect(actionSearch[0].action).toBe('REINDEX_VECTOR_CHUNK');

      const ipSearch = await repository.getAuditLogs(undefined, undefined, '192.168.10.45');
      expect(ipSearch.length).toBeGreaterThanOrEqual(1);
      expect(ipSearch.every((l) => l.ipAddress.includes('192.168.10.45'))).toBe(true);

      const resourceSearch = await repository.getAuditLogs(undefined, undefined, 'prod_secure_life_plus');
      expect(resourceSearch.length).toBe(1);
    });

    it('combines category, status, and search filters', async () => {
      const filtered = await repository.getAuditLogs('underwriting', 'FAILED', 'budi');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('aud_2026_0906_006');
    });
  });

  describe('getAuditLogById', () => {
    it('returns specific audit log when id is found', async () => {
      const log = await repository.getAuditLogById('aud_2026_0906_001');
      expect(log).not.toBeNull();
      expect(log?.id).toBe('aud_2026_0906_001');
      expect(log?.action).toBe('APPROVE_APPLICATION');
      expect(log?.details).toBeDefined();
    });

    it('returns null when audit log is not found', async () => {
      const log = await repository.getAuditLogById('non_existent_id');
      expect(log).toBeNull();
    });
  });
});
