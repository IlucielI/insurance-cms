import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  pingServicesAction,
  pingSingleServiceAction,
  fetchSystemOverviewAction,
  fetchAuditLogsAction,
  fetchAuditLogByIdAction,
} from './actions';
import { healthAuditService } from '@/server/di';

describe('Health Server Actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('pingServicesAction calls healthAuditService.pingServices and returns list', async () => {
    const mockServices = [
      {
        id: 'service_postgres',
        name: 'PostgreSQL',
        type: 'Database',
        endpoint: 'localhost:5432',
        status: 'online' as const,
        latencyMs: 2.1,
        uptimePercentage: 99.99,
        lastChecked: new Date().toISOString(),
      },
    ];
    vi.spyOn(healthAuditService, 'pingServices').mockResolvedValueOnce(mockServices);

    const result = await pingServicesAction();
    expect(result).toEqual(mockServices);
    expect(healthAuditService.pingServices).toHaveBeenCalledWith(undefined);
  });

  it('pingSingleServiceAction calls healthAuditService.pingSingleService and returns item', async () => {
    const mockService = {
      id: 'service_redis',
      name: 'Redis',
      type: 'Cache',
      endpoint: 'localhost:6379',
      status: 'online' as const,
      latencyMs: 1.5,
      uptimePercentage: 100,
      lastChecked: new Date().toISOString(),
    };
    vi.spyOn(healthAuditService, 'pingSingleService').mockResolvedValueOnce(mockService);

    const result = await pingSingleServiceAction('service_redis');
    expect(result).toEqual(mockService);
    expect(healthAuditService.pingSingleService).toHaveBeenCalledWith('service_redis');
  });

  it('fetchSystemOverviewAction calls healthAuditService.getSystemOverview', async () => {
    const mockOverview = {
      cmsMetadata: {
        version: '1.0',
        gitHash: '123',
        startedAt: new Date(),
      },
      overallStatus: 'online' as const,
      activeServicesCount: 5,
      totalServicesCount: 5,
      avgLatencyMs: 12.5,
      services: [],
      auditLogs: [],
    };
    vi.spyOn(healthAuditService, 'getSystemOverview').mockResolvedValueOnce(mockOverview);

    const result = await fetchSystemOverviewAction();
    expect(result).toEqual(mockOverview);
    expect(healthAuditService.getSystemOverview).toHaveBeenCalled();
  });

  it('fetchAuditLogsAction calls healthAuditService.getAuditLogs with filters', async () => {
    const mockLogs = [
      {
        id: 'aud_1',
        timestamp: new Date().toISOString(),
        actorName: 'Budi',
        actorRole: 'Underwriter',
        action: 'APPROVE',
        category: 'underwriting',
        targetResource: '#APP-1',
        ipAddress: '127.0.0.1',
        status: 'SUCCESS' as const,
        details: {},
      },
    ];
    vi.spyOn(healthAuditService, 'getAuditLogs').mockResolvedValueOnce(mockLogs);

    const result = await fetchAuditLogsAction('underwriting', 'SUCCESS', 'Budi');
    expect(result).toEqual(mockLogs);
    expect(healthAuditService.getAuditLogs).toHaveBeenCalledWith('underwriting', 'SUCCESS', 'Budi');
  });

  it('fetchAuditLogByIdAction calls healthAuditService.getAuditLogById', async () => {
    const mockLog = {
      id: 'aud_1',
      timestamp: new Date().toISOString(),
      actorName: 'Budi',
      actorRole: 'Underwriter',
      action: 'APPROVE',
      category: 'underwriting',
      targetResource: '#APP-1',
      ipAddress: '127.0.0.1',
      status: 'SUCCESS' as const,
      details: {},
    };
    vi.spyOn(healthAuditService, 'getAuditLogById').mockResolvedValueOnce(mockLog);

    const result = await fetchAuditLogByIdAction('aud_1');
    expect(result).toEqual(mockLog);
    expect(healthAuditService.getAuditLogById).toHaveBeenCalledWith('aud_1');
  });
});
