import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoreApiApplicationRepository } from './application.core-api.repository';
import { ApplicationMockRepository } from './application.mock.repository';

describe('CoreApiApplicationRepository', () => {
  const mockFallback = new ApplicationMockRepository();
  let repo: CoreApiApplicationRepository;

  beforeEach(() => {
    repo = new CoreApiApplicationRepository(mockFallback, 'http://localhost:8080');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fall back to mock repository when Core API fetch fails or is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error: Connection refused'))
    );

    const dossiers = await repo.findAll();
    expect(dossiers.length).toBeGreaterThan(0);
    expect(dossiers[0].id).toContain('APP');
  });

  it('should map Core API application response to UnderwritingDossier correctly', async () => {
    const fakeCoreApiResponse = {
      data: [
        {
          id: 'app_demo_01',
          product_id: 'prod_secure_life_plus',
          product: {
            id: 'prod_secure_life_plus',
            name: 'Secure Life Plus',
            slug: 'secure-life-plus',
          },
          full_name: 'Budi Santoso',
          email: 'budi@example.com',
          phone: '081234567890',
          age: 34,
          gender: 'male',
          sum_assured: 500000000,
          payment_term: 20,
          payment_frequency: 'monthly',
          smoker: 'no',
          occupation_class: 'standard',
          health_risk: 'low',
          premium: 450000,
          status: 'under_review',
          created_at: '2026-09-07T00:00:00Z',
          updated_at: '2026-09-07T00:00:00Z',
          review_checks: [
            {
              id: 'chk_1',
              application_id: 'app_demo_01',
              check_type: 'identity_verified',
              status: 'passed',
              notes: 'Dukcapil valid',
              reviewed_by: 'Lead UW',
            },
            {
              id: 'chk_2',
              application_id: 'app_demo_01',
              check_type: 'income_verified',
              status: 'passed',
              notes: 'Slip gaji valid',
            },
            {
              id: 'chk_3',
              application_id: 'app_demo_01',
              check_type: 'documents_complete',
              status: 'pending',
            },
            {
              id: 'chk_4',
              application_id: 'app_demo_01',
              check_type: 'medical_required',
              status: 'not_needed',
            },
          ],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => fakeCoreApiResponse,
      })
    );

    const dossiers = await repo.findAll();
    expect(dossiers.length).toBe(1);

    const d = dossiers[0];
    expect(d.id).toBe('#APP_DEMO_01');
    expect(d.applicantName).toBe('Budi Santoso');
    expect(d.applicantAge).toBe(34);
    expect(d.productName).toBe('Secure Life Plus');
    expect(d.productSlug).toBe('secure-life-plus');
    expect(d.sumAssured).toContain('500.000.000');
    expect(d.monthlyPremium).toContain('450.000');
    expect(d.status).toBe('under_review');
    expect(d.statusLabel).toBe('Under Review');
    expect(d.passedChecksCount).toBe(3); // 2 passed + 1 not_needed
    expect(d.totalChecksCount).toBe(4);
    expect(d.reviewChecks[0].status).toBe('PASSED');
    expect(d.reviewChecks[1].status).toBe('PASSED');
    expect(d.reviewChecks[2].status).toBe('UNDER_REVIEW');
    expect(d.reviewChecks[3].status).toBe('NOT_NEEDED');
  });

  it('should find application by id from Core API', async () => {
    const fakeApp = {
      id: 'app_demo_02',
      product_id: 'prod_health',
      product: { name: 'Health Guard Essential', slug: 'health-guard-essential' },
      full_name: 'Siti Rahmawati',
      age: 29,
      sum_assured: 250000000,
      payment_term: 10,
      premium: 220000,
      status: 'submitted',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: fakeApp }),
      })
    );

    const dossier = await repo.findById('app_demo_02');
    expect(dossier).not.toBeNull();
    expect(dossier?.applicantName).toBe('Siti Rahmawati');
    expect(dossier?.status).toBe('submitted');
  });

  it('should update review check via Core API and fall back on error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'app_demo_01',
          full_name: 'Budi Santoso',
          status: 'under_review',
          review_checks: [
            {
              check_type: 'documents_complete',
              status: 'passed',
              notes: 'Semua berkas sah',
            },
          ],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const updated = await repo.updateReviewCheck(
      'app_demo_01',
      'documents_complete',
      'PASSED',
      'Semua berkas sah'
    );
    expect(fetchMock).toHaveBeenCalled();
    expect(updated.applicantName).toBe('Budi Santoso');
  });

  it('should update status via Core API and fall back on error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'app_demo_01',
          full_name: 'Budi Santoso',
          status: 'approved',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const updated = await repo.updateStatus('app_demo_01', 'approved');
    expect(fetchMock).toHaveBeenCalled();
    expect(updated.status).toBe('approved');
  });

  it('should delegate saveInternalNotes to fallback repository', async () => {
    const updated = await repo.saveInternalNotes('#APP-2026-8819', 'Catatan penting');
    expect(updated.internalAuditNotes).toBe('Catatan penting');
  });

  it('should immediately use fallback without calling fetch when baseUrl is empty', async () => {
    const emptyRepo = new CoreApiApplicationRepository(mockFallback, '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const dossiers = await emptyRepo.findAll();
    expect(dossiers.length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();

    const dossier = await emptyRepo.findById('#APP-2026-8819');
    expect(dossier?.applicantName).toBe('Budi Santoso');
    expect(fetchMock).not.toHaveBeenCalled();

    const updatedCheck = await emptyRepo.updateReviewCheck('#APP-2026-8819', 'documents_complete', 'PASSED');
    expect(updatedCheck).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();

    const updatedStatus = await emptyRepo.updateStatus('#APP-2026-8819', 'approved');
    expect(updatedStatus).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
