import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthAuditService } from './health-audit.service';
import type {
  IHealthRepository,
  SystemHealthOverview,
  AuditLogEntry,
  ServiceHealthItem,
} from '../repositories/health.repository.interface';

describe('HealthAuditService', () => {
  let repository: IHealthRepository;
  let service: HealthAuditService;

  const mockOverview: SystemHealthOverview = {
    cmsMetadata: {
      appName: 'Insurance CMS',
      version: '1.0.0',
      nodeEnv: 'test',
      gitHash: 'sha256:test1234',
      startedAt: new Date(),
      timestamp: '2026-09-06T07:00:00.000Z',
    },
    overallStatus: 'online',
    activeServicesCount: 5,
    totalServicesCount: 5,
    avgLatencyMs: 18.5,
    services: [
      {
        id: 'service_core_api',
        name: 'Core API Backend (Go Fiber)',
        type: 'Core Microservice',
        endpoint: 'http://localhost:8080/health',
        status: 'online',
        latencyMs: 18,
        uptimePercentage: 99.98,
        lastChecked: '2026-09-06T07:00:00.000Z',
      },
    ],
    auditLogs: [],
  };

  const mockServices: ServiceHealthItem[] = [
    {
      id: 'service_core_api',
      name: 'Core API Backend (Go Fiber)',
      type: 'Core Microservice',
      endpoint: 'http://localhost:8080/health',
      status: 'online',
      latencyMs: 15,
      uptimePercentage: 99.98,
      lastChecked: '2026-09-06T07:00:01.000Z',
    },
  ];

  const mockAuditLogs: AuditLogEntry[] = [
    {
      id: 'aud_2026_0906_001',
      timestamp: '2026-09-06T06:55:12Z',
      actorName: 'Budi Pratama',
      actorRole: 'Senior Underwriter',
      action: 'APPROVE_APPLICATION',
      category: 'underwriting',
      targetResource: '#APP-2026-8819',
      ipAddress: '192.168.10.45',
      status: 'SUCCESS',
      details: {
        applicant: 'Budi Santoso',
      },
    },
  ];

  beforeEach(() => {
    repository = {
      getSystemOverview: vi.fn().mockResolvedValue(mockOverview),
      pingServices: vi.fn().mockResolvedValue(mockServices),
      pingSingleService: vi.fn().mockResolvedValue(mockServices[0]),
      getAuditLogs: vi.fn().mockResolvedValue(mockAuditLogs),
      getAuditLogById: vi.fn().mockResolvedValue(mockAuditLogs[0]),
    };
    service = new HealthAuditService(repository);
  });

  describe('getSystemOverview', () => {
    it('returns system health overview from repository', async () => {
      const result = await service.getSystemOverview();

      expect(result.overallStatus).toBe('online');
      expect(result.activeServicesCount).toBe(5);
      expect(result.avgLatencyMs).toBe(18.5);
      expect(result.services).toHaveLength(1);
      expect(repository.getSystemOverview).toHaveBeenCalledOnce();
    });
  });

  describe('pingServices', () => {
    it('delegates pingServices to repository and returns updated services', async () => {
      const result = await service.pingServices();

      expect(repository.pingServices).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockServices);
    });

    it('delegates pingServices with trimmed serviceId', async () => {
      await service.pingServices('  service_core_api  ');
      expect(repository.pingServices).toHaveBeenCalledWith('service_core_api');
    });
  });

  describe('pingSingleService', () => {
    it('delegates pingSingleService to repository with trimmed serviceId', async () => {
      const result = await service.pingSingleService('  service_core_api  ');
      expect(repository.pingSingleService).toHaveBeenCalledWith('service_core_api');
      expect(result).toEqual(mockServices[0]);
    });

    it('returns null immediately without calling repository if serviceId is empty or whitespace', async () => {
      const result = await service.pingSingleService('   ');
      expect(result).toBeNull();
      expect(repository.pingSingleService).not.toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    it('delegates getAuditLogs to repository with trimmed search query and filters', async () => {
      const result = await service.getAuditLogs('underwriting', 'SUCCESS', '  Budi  ');

      expect(repository.getAuditLogs).toHaveBeenCalledWith('underwriting', 'SUCCESS', 'Budi');
      expect(result).toEqual(mockAuditLogs);
    });

    it('passes undefined parameters when no filters are provided', async () => {
      const result = await service.getAuditLogs();

      expect(repository.getAuditLogs).toHaveBeenCalledWith(undefined, undefined, undefined);
      expect(result).toEqual(mockAuditLogs);
    });
  });

  describe('getAuditLogById', () => {
    it('delegates getAuditLogById to repository for valid ID', async () => {
      const result = await service.getAuditLogById('  aud_2026_0906_001  ');

      expect(repository.getAuditLogById).toHaveBeenCalledWith('aud_2026_0906_001');
      expect(result).toEqual(mockAuditLogs[0]);
    });

    it('returns null immediately if ID is empty or whitespace', async () => {
      const result = await service.getAuditLogById('   ');

      expect(result).toBeNull();
      expect(repository.getAuditLogById).not.toHaveBeenCalled();
    });
  });
});
