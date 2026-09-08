import {
  IHealthRepository,
  ServiceHealthItem,
  AuditLogEntry,
  SystemHealthOverview,
  AuditSeverity,
} from './health.repository.interface';
import { ISystemRepository } from './system.repository.interface';
import { SystemRepository } from './system.repository';

export class HealthMockRepository implements IHealthRepository {
  constructor(private readonly systemRepository: ISystemRepository = new SystemRepository()) {}

  private services: ServiceHealthItem[] = [
    {
      id: 'service_core_api',
      name: 'Core API Backend (Go Fiber)',
      type: 'Core Microservice',
      endpoint: 'http://localhost:8080/health',
      status: 'online',
      latencyMs: 18,
      uptimePercentage: 99.98,
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'service_postgres',
      name: 'PostgreSQL 16 & pgvector DB',
      type: 'Primary Relational Database',
      endpoint: '172.17.0.1:5432/insurance_core',
      status: 'online',
      latencyMs: 4,
      uptimePercentage: 99.99,
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'service_redis',
      name: 'Redis Distributed Cache',
      type: 'Cache & Rate Limiting Engine',
      endpoint: '172.17.0.1:6379/cache',
      status: 'online',
      latencyMs: 1.5,
      uptimePercentage: 100,
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'service_smtp',
      name: 'SMTP Relay & e-Policy Dispatcher',
      type: 'Electronic Policy Delivery',
      endpoint: '172.17.0.1:1025',
      status: 'online',
      latencyMs: 28,
      uptimePercentage: 99.92,
      lastChecked: new Date().toISOString(),
    },
  ];

  private auditLogs: AuditLogEntry[] = [
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
        product: 'Secure Life Plus',
        sumAssured: 500_000_000,
        policyNumber: 'POL-2026-SLP-08819',
        reason: 'Seluruh 4 pilar verifikasi lengkap dan memenuhi kriteria automated underwriting.',
      },
    },
    {
      id: 'aud_2026_0906_002',
      timestamp: '2026-09-06T06:40:30Z',
      actorName: 'Dewi Sartika',
      actorRole: 'Product Actuary',
      action: 'UPDATE_PRODUCT_PRICING',
      category: 'product',
      targetResource: 'prod_secure_life_plus',
      ipAddress: '192.168.10.12',
      status: 'SUCCESS',
      details: {
        productName: 'Secure Life Plus',
        previousBaseRate: 0.0035,
        newBaseRate: 0.0035,
        updatedField: 'maxSumAssured adjusted to Rp 1.000.000.000',
      },
    },
    {
      id: 'aud_2026_0906_003',
      timestamp: '2026-09-06T06:32:15Z',
      actorName: 'Budi Pratama',
      actorRole: 'Senior Underwriter',
      action: 'MANUAL_OVERRIDE_CHECK',
      category: 'underwriting',
      targetResource: '#APP-2026-8821',
      ipAddress: '192.168.10.45',
      status: 'WARNING',
      details: {
        pillar: 'Medical History & Health Declaration',
        previousStatus: 'flagged',
        newStatus: 'verified',
        justification: 'Hasil MCU treadmill test membuktikan aritmia sinus jinak tanpa iskemia miokard.',
      },
    },
    {
      id: 'aud_2026_0906_004',
      timestamp: '2026-09-06T06:15:00Z',
      actorName: 'Andi Wijaya',
      actorRole: 'Junior Underwriter',
      action: 'REQUEST_FOR_INFORMATION',
      category: 'underwriting',
      targetResource: '#APP-2026-8820',
      ipAddress: '192.168.10.68',
      status: 'SUCCESS',
      details: {
        applicant: 'Siti Rahmawati',
        requestedDocuments: ['Surat rujukan dokter spesialis', 'Kuitansi asli pembayaran rawat inap'],
        dueDate: '2026-09-13T23:59:59Z',
      },
    },
    {
      id: 'aud_2026_0906_005',
      timestamp: '2026-09-06T05:50:00Z',
      actorName: 'System Worker',
      actorRole: 'Background Daemon',
      action: 'REINDEX_VECTOR_CHUNK',
      category: 'knowledge',
      targetResource: 'doc_underwriting_up_medical',
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: {
        vectorDimension: 1024,
        chunksGenerated: 16,
        model: 'text-embedding-004',
      },
    },
    {
      id: 'aud_2026_0906_006',
      timestamp: '2026-09-06T05:25:10Z',
      actorName: 'Budi Pratama',
      actorRole: 'Senior Underwriter',
      action: 'REJECT_APPLICATION',
      category: 'underwriting',
      targetResource: '#APP-2026-8818',
      ipAddress: '192.168.10.45',
      status: 'FAILED',
      details: {
        applicant: 'Bambang Kusuma',
        reason: 'Skor kredit SLIK kol 5 dan terdeteksi fraud manipulasi dokumen slip gaji.',
        pinAuthorized: true,
      },
    },
    {
      id: 'aud_2026_0906_007',
      timestamp: '2026-09-06T05:20:05Z',
      actorName: 'Andi Wijaya',
      actorRole: 'Junior Underwriter',
      action: 'SECURITY_PIN_FAILURE',
      category: 'auth',
      targetResource: '#APP-2026-8818',
      ipAddress: '192.168.10.68',
      status: 'FAILED',
      details: {
        attempt: 1,
        errorMessage: 'Invalid authorization PIN entered during application reject attempt.',
      },
    },
    {
      id: 'aud_2026_0906_008',
      timestamp: '2026-09-06T04:45:00Z',
      actorName: 'Siti Rahma',
      actorRole: 'Compliance Officer',
      action: 'CREATE_KNOWLEDGE_DOC',
      category: 'knowledge',
      targetResource: 'doc_aml_pep_screening',
      ipAddress: '192.168.10.22',
      status: 'SUCCESS',
      details: {
        title: 'Kepatuhan Anti-Pencucian Uang (AML) & Screening PEP',
        policyRef: 'POJK-12/2024/AML',
      },
    },
  ];

  async getSystemOverview(): Promise<SystemHealthOverview> {
    const cmsMetadata = this.systemRepository.getSystemMetadata();
    const activeServicesCount = this.services.filter((s) => s.status === 'online').length;
    const totalServicesCount = this.services.length;

    let totalLatency = 0;
    for (const s of this.services) {
      totalLatency += s.latencyMs;
    }
    const avgLatencyMs = Number((totalLatency / this.services.length).toFixed(1));

    const overallStatus =
      activeServicesCount === totalServicesCount
        ? 'online'
        : activeServicesCount > 0
        ? 'degraded'
        : 'offline';

    return Promise.resolve(
      structuredClone({
        cmsMetadata,
        overallStatus,
        activeServicesCount,
        totalServicesCount,
        avgLatencyMs,
        services: this.services,
        auditLogs: this.auditLogs,
        apiMetadata: {
          version: '1.2.0',
          gitHash: '9a4f2b1',
          uptime: '342h18m',
          uptimeFormatted: '342j 18m aktif tanpa restart',
          statusCode: 200,
        },
      })
    );
  }

  async pingServices(serviceId?: string): Promise<ServiceHealthItem[]> {
    const now = new Date().toISOString();
    // Simulate slight jitter around current latency only for targeted or all services
    this.services = this.services.map((s) => {
      if (serviceId && s.id !== serviceId) {
        return s;
      }
      const jitter = Math.floor(Math.random() * 6) - 2;
      const newLatency = Math.max(1, s.latencyMs + jitter);
      return {
        ...s,
        latencyMs: newLatency,
        lastChecked: now,
      };
    });

    return Promise.resolve(structuredClone(this.services));
  }

  async pingSingleService(serviceId: string): Promise<ServiceHealthItem | null> {
    const updated = await this.pingServices(serviceId);
    const target = updated.find((s) => s.id === serviceId);
    return target ? structuredClone(target) : null;
  }

  async getAuditLogs(
    category?: string,
    status?: AuditSeverity,
    search?: string
  ): Promise<AuditLogEntry[]> {
    let result = this.auditLogs;

    if (category && category !== 'all') {
      result = result.filter((l) => l.category === category);
    }

    if (status && status !== ('all' as AuditSeverity)) {
      result = result.filter((l) => l.status === status);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.actorName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.targetResource.toLowerCase().includes(q) ||
          l.ipAddress.includes(q)
      );
    }

    return Promise.resolve(structuredClone(result));
  }

  async getAuditLogById(id: string): Promise<AuditLogEntry | null> {
    const log = this.auditLogs.find((l) => l.id === id);
    if (!log) return Promise.resolve(null);
    return Promise.resolve(structuredClone(log));
  }
}
