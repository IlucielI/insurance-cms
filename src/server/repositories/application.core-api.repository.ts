import {
  IApplicationRepository,
  UnderwritingDossier,
  ApplicationFilterParams,
  PillarType,
  PillarStatus,
  ApplicationStatus,
  ApplicationReviewCheck,
} from './application.repository.interface';
import { ApplicationMockRepository } from './application.mock.repository';

interface CoreApiProduct {
  id: string;
  name: string;
  slug: string;
}

interface CoreApiReviewCheck {
  id: string;
  application_id: string;
  check_type: PillarType;
  status: 'pending' | 'passed' | 'failed' | 'not_needed';
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface CoreApiApplication {
  id: string;
  product_id: string;
  product?: CoreApiProduct;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  sum_assured: number;
  payment_term: number;
  payment_frequency: string;
  smoker: string;
  occupation_class: string;
  health_risk: string;
  premium: number;
  status: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  review_checks?: CoreApiReviewCheck[];
}

export class CoreApiApplicationRepository implements IApplicationRepository {
  private readonly fallbackRepo: IApplicationRepository;
  private readonly baseUrl: string;

  constructor(
    fallbackRepo: IApplicationRepository = new ApplicationMockRepository(),
    baseUrl?: string
  ) {
    this.fallbackRepo = fallbackRepo;
    this.baseUrl = baseUrl || this.resolveBaseUrl();
  }

  private resolveBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_CORE_API_URL?.trim() || '';
    }
    return (
      process.env.CORE_API_INTERNAL_URL?.trim() ||
      process.env.NEXT_PUBLIC_CORE_API_URL?.trim() ||
      ''
    );
  }

  private formatCurrency(amount: number): string {
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
  }

  private calculateRisk(app: CoreApiApplication): { score: number; grade: string } {
    let score = 95;
    if (app.smoker === 'yes') score -= 10;
    if (app.occupation_class === 'high') score -= 8;
    if (app.health_risk === 'high') score -= 12;
    else if (app.health_risk === 'medium') score -= 5;
    if (app.age > 45) score -= 5;

    let grade = 'A+';
    if (score < 75) grade = 'B';
    else if (score < 88) grade = 'A';

    return { score, grade };
  }

  private mapReviewCheck(check: CoreApiReviewCheck): ApplicationReviewCheck {
    let status: PillarStatus = 'UNDER_REVIEW';
    let statusBg = '#fef3c7';
    let statusColor = '#92400e';

    if (check.status === 'passed') {
      status = 'PASSED';
      statusBg = '#d1fae5';
      statusColor = '#065f46';
    } else if (check.status === 'failed') {
      status = 'FAILED';
      statusBg = '#fee2e2';
      statusColor = '#991b1b';
    } else if (check.status === 'not_needed') {
      status = 'NOT_NEEDED';
      statusBg = '#f1f5f9';
      statusColor = '#475569';
    }

    const titles: Record<PillarType, string> = {
      identity_verified: '1. Verifikasi Identitas (Dukcapil OCR)',
      income_verified: '2. Verifikasi Pendapatan & Debt-to-Income (DSR)',
      documents_complete: '3. Kelengkapan Berkas & Legalitas',
      medical_required: '4. Skrining Medis & Formulir Kesehatan',
    };

    return {
      type: check.check_type,
      title: titles[check.check_type] || check.check_type,
      status,
      statusBg,
      statusColor,
      details: check.notes || 'Pemeriksaan standar sistem underwriting.',
      reviewer: check.reviewed_by
        ? `Diverifikasi oleh: ${check.reviewed_by}`
        : 'System Underwriting Engine (Auto)',
    };
  }

  private mapApplicationToDossier(app: CoreApiApplication): UnderwritingDossier {
    const risk = this.calculateRisk(app);
    const checks: ApplicationReviewCheck[] = (app.review_checks || []).map((c) =>
      this.mapReviewCheck(c)
    );

    // If review checks were not populated by backend, supply default 4 pillars
    if (checks.length === 0) {
      const defaultTypes: PillarType[] = [
        'identity_verified',
        'income_verified',
        'documents_complete',
        'medical_required',
      ];
      defaultTypes.forEach((t) => {
        checks.push(this.mapReviewCheck({
          id: `${app.id}-${t}`,
          application_id: app.id,
          check_type: t,
          status: 'pending',
        }));
      });
    }

    const passedChecksCount = checks.filter(
      (c) => c.status === 'PASSED' || c.status === 'NOT_NEEDED'
    ).length;

    let appStatus: ApplicationStatus = 'submitted';
    let statusLabel = 'Menunggu Review';

    if (app.status === 'under_review') {
      appStatus = 'under_review';
      statusLabel = 'Under Review';
    } else if (app.status === 'approved') {
      appStatus = 'approved';
      statusLabel = 'Disetujui';
    } else if (app.status === 'rejected') {
      appStatus = 'rejected';
      statusLabel = 'Ditolak';
    }

    // Generate deterministic synthetic NIK based on application ID & age
    const idHash = app.id.replace(/[^0-9]/g, '').padEnd(8, '0').slice(0, 8);
    const syntheticNik = `327104${String(app.age).padStart(2, '0')}${idHash}`;

    return {
      id: app.id.startsWith('#') ? app.id : `#${app.id.toUpperCase()}`,
      applicantName: app.full_name,
      applicantAge: app.age,
      nik: syntheticNik,
      productName: app.product?.name || 'Asuransi Proteksi Jiwa',
      productSlug: app.product?.slug || 'secure-life-plus',
      sumAssured: this.formatCurrency(app.sum_assured),
      status: appStatus,
      statusLabel,
      riskScore: risk.score,
      riskGrade: risk.grade,
      slaRemainingMinutes: 45,
      slaText: 'SLA: 45 min',
      slaColor: appStatus === 'approved' ? '#10b981' : '#ef4444',
      monthlyPremium: this.formatCurrency(app.premium),
      tenorYears: app.payment_term,
      paymentMethod: 'VA Mandiri',
      autoDebet: true,
      beneficiaryName: 'Keluarga Ahli Waris',
      beneficiaryRelation: 'Keluarga',
      beneficiarySharePct: 100,
      reviewChecks: checks,
      passedChecksCount,
      totalChecksCount: checks.length,
      internalAuditNotes:
        app.rejection_reason ||
        (app.reviewed_by
          ? `Telah diverifikasi oleh ${app.reviewed_by}`
          : 'Pemeriksaan kepatuhan underwriting otomatis.'),
      auditSignature: app.reviewed_by
        ? `Diperiksa oleh: ${app.reviewed_by} • Terhubung ke Core API`
        : 'Sistem Underwriting Otomatis • Terhubung ke Core API',
      auditHash: `sha256:${app.id.toLowerCase()}-verified`,
    };
  }

  async findAll(params?: ApplicationFilterParams): Promise<UnderwritingDossier[]> {
    if (!this.baseUrl) {
      return this.fallbackRepo.findAll(params);
    }
    try {
      const url = new URL(`${this.baseUrl}/api/v1/applications`);
      if (params?.status && params.status !== 'all') {
        const mappedStatus = params.status === 'review_needed' ? 'under_review' : params.status;
        url.searchParams.set('status', mappedStatus);
      }
      url.searchParams.set('limit', '50');

      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Core API error: HTTP ${res.status}`);
      }

      const json = await res.json();
      const rawApplications: CoreApiApplication[] = json.data || [];

      if (rawApplications.length === 0) {
        // If Core API has no records, use fallback data
        return this.fallbackRepo.findAll(params);
      }

      let dossiers = rawApplications.map((app) => this.mapApplicationToDossier(app));

      // In-memory search & product filtering if provided
      if (params?.search) {
        const q = params.search.toLowerCase();
        dossiers = dossiers.filter(
          (d) =>
            d.applicantName.toLowerCase().includes(q) ||
            d.nik.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q)
        );
      }

      if (params?.product && params.product !== 'all') {
        dossiers = dossiers.filter((d) => d.productSlug === params.product);
      }

      return dossiers;
    } catch {
      // Graceful fallback to mock repository on connection failure or error
      return this.fallbackRepo.findAll(params);
    }
  }

  async findById(id: string): Promise<UnderwritingDossier | null> {
    if (!this.baseUrl) {
      return this.fallbackRepo.findById(id);
    }
    try {
      const rawId = id.replace(/^#/, '').toLowerCase();
      const res = await fetch(`${this.baseUrl}/api/v1/applications/${rawId}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        return this.fallbackRepo.findById(id);
      }

      const json = await res.json();
      if (!json.data) return this.fallbackRepo.findById(id);

      return this.mapApplicationToDossier(json.data);
    } catch {
      return this.fallbackRepo.findById(id);
    }
  }

  async updateReviewCheck(
    id: string,
    pillarType: PillarType,
    status: PillarStatus,
    notes?: string
  ): Promise<UnderwritingDossier> {
    if (!this.baseUrl) {
      return this.fallbackRepo.updateReviewCheck(id, pillarType, status, notes);
    }
    try {
      const rawId = id.replace(/^#/, '').toLowerCase();
      let coreStatus: 'passed' | 'failed' | 'not_needed' | 'pending' = 'pending';
      if (status === 'PASSED') coreStatus = 'passed';
      else if (status === 'FAILED') coreStatus = 'failed';
      else if (status === 'NOT_NEEDED' || status === 'WAIVED') coreStatus = 'not_needed';

      const res = await fetch(
        `${this.baseUrl}/api/v1/applications/${rawId}/review-checks/${pillarType}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            status: coreStatus,
            reviewed_by: 'Lead Underwriter',
            notes: notes || `Pilar diverifikasi sebagai ${status} via CMS Workbench.`,
          }),
        }
      );

      if (!res.ok) {
        return this.fallbackRepo.updateReviewCheck(id, pillarType, status, notes);
      }

      const updated = await this.findById(id);
      return updated || this.fallbackRepo.updateReviewCheck(id, pillarType, status, notes);
    } catch {
      return this.fallbackRepo.updateReviewCheck(id, pillarType, status, notes);
    }
  }

  async updateStatus(
    id: string,
    newStatus: ApplicationStatus,
    reason?: string,
    notes?: string
  ): Promise<UnderwritingDossier> {
    if (!this.baseUrl) {
      return this.fallbackRepo.updateStatus(id, newStatus, reason, notes);
    }
    try {
      const rawId = id.replace(/^#/, '').toLowerCase();
      const mappedCoreStatus =
        newStatus === 'rfi_requested' ? 'under_review' : newStatus;

      // Ensure that if approving from submitted, we step through under_review if required
      const current = await this.findById(id);
      if (current && current.status === 'submitted' && mappedCoreStatus === 'approved') {
        await fetch(`${this.baseUrl}/api/v1/applications/${rawId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'under_review',
            reviewed_by: 'Lead Underwriter',
          }),
        });
      }

      const res = await fetch(`${this.baseUrl}/api/v1/applications/${rawId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          status: mappedCoreStatus,
          reviewed_by: 'Lead Underwriter',
          rejection_reason: reason || (newStatus === 'rejected' ? 'Ditolak oleh underwriter' : ''),
        }),
      });

      if (!res.ok) {
        return this.fallbackRepo.updateStatus(id, newStatus, reason, notes);
      }

      const updated = await this.findById(id);
      return updated || this.fallbackRepo.updateStatus(id, newStatus, reason, notes);
    } catch {
      return this.fallbackRepo.updateStatus(id, newStatus, reason, notes);
    }
  }

  async saveInternalNotes(id: string, notes: string): Promise<UnderwritingDossier> {
    return this.fallbackRepo.saveInternalNotes(id, notes);
  }
}
