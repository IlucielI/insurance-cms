import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoreApiApplicationRepository } from './application.core-api.repository';

describe('CoreApiApplicationRepository', () => {
  let repo: CoreApiApplicationRepository;

  beforeEach(() => {
    repo = new CoreApiApplicationRepository('http://localhost:8080');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error when baseUrl is not configured', async () => {
    const unconfiguredRepo = new CoreApiApplicationRepository('');
    await expect(unconfiguredRepo.findAll()).rejects.toThrow('Core API URL is not configured');
    await expect(unconfiguredRepo.findById('app_1')).rejects.toThrow('Core API URL is not configured');
    await expect(unconfiguredRepo.updateReviewCheck('app_1', 'documents_complete', 'PASSED')).rejects.toThrow(
      'Core API URL is not configured'
    );
    await expect(unconfiguredRepo.updateStatus('app_1', 'approved')).rejects.toThrow(
      'Core API URL is not configured'
    );
  });

  it('should throw error when Core API fetch fails with network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error: connection refused'))
    );

    await expect(repo.findAll()).rejects.toThrow('Network error: connection refused');
  });

  it('should throw error when Core API returns HTTP error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    await expect(repo.findAll()).rejects.toThrow('Core API error fetching applications: HTTP 500');
  });

  it('should map Core API applications to UnderwritingDossier correctly on success', async () => {
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

    const dossiers = await repo.findAll({ search: 'Budi', product: 'secure-life-plus' });
    expect(dossiers.length).toBe(1);

    const d = dossiers[0];
    expect(d.id).toBe('#APP_DEMO_01');
    expect(d.applicantName).toBe('Budi Santoso');
    expect(d.applicantAge).toBe(34);
    expect(d.productName).toBe('Secure Life Plus');
    expect(d.sumAssured).toContain('500.000.000');
    expect(d.monthlyPremium).toContain('450.000');
    expect(d.status).toBe('under_review');
    expect(d.statusLabel).toBe('Under Review');
    expect(d.passedChecksCount).toBe(3);
    expect(d.totalChecksCount).toBe(4);
    expect(d.reviewChecks[0].status).toBe('PASSED');
    expect(d.reviewChecks[1].status).toBe('PASSED');
    expect(d.reviewChecks[2].status).toBe('UNDER_REVIEW');
    expect(d.reviewChecks[3].status).toBe('NOT_NEEDED');
  });

  it('should find application by id and return null on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })
    );

    const dossier = await repo.findById('non_existent');
    expect(dossier).toBeNull();
  });

  it('should update review check via Core API PATCH request', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string, opts?: any) => {
      if (opts?.method === 'PATCH') {
        return { ok: true, status: 204 };
      }
      return {
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
      };
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

  it('should update status via Core API and save internal notes', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string, opts?: any) => {
      if (opts?.method === 'PATCH') {
        return { ok: true, status: 204 };
      }
      return {
        ok: true,
        json: async () => ({
          data: {
            id: 'app_demo_01',
            full_name: 'Budi Santoso',
            status: 'approved',
          },
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const updated = await repo.updateStatus('app_demo_01', 'approved', 'Disetujui', 'Catatan underwriting');
    expect(fetchMock).toHaveBeenCalled();
    expect(updated.status).toBe('approved');
    expect(updated.internalAuditNotes).toBe('Catatan underwriting');

    const saved = await repo.saveInternalNotes('app_demo_01', 'Catatan baru');
    expect(saved.internalAuditNotes).toBe('Catatan baru');
  });
});
