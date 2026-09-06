import { describe, it, expect } from 'vitest';
import { ApplicationMockRepository } from './application.mock.repository';

describe('ApplicationMockRepository', () => {
  it('should find all applications and support filtering', async () => {
    const repo = new ApplicationMockRepository();
    const all = await repo.findAll();
    expect(all.length).toBe(7);

    const reviewNeeded = await repo.findAll({ status: 'review_needed' });
    expect(reviewNeeded.every((d) => d.status === 'under_review')).toBe(true);

    const submitted = await repo.findAll({ status: 'submitted' });
    expect(submitted.every((d) => d.status === 'submitted')).toBe(true);

    const searchByName = await repo.findAll({ search: 'Siti' });
    expect(searchByName.length).toBe(1);
    expect(searchByName[0].applicantName).toBe('Siti Rahmawati');

    const searchByNik = await repo.findAll({ search: '32710488' });
    expect(searchByNik.length).toBe(1);
    expect(searchByNik[0].id).toBe('#APP-2026-8819');

    const searchById = await repo.findAll({ search: '8821' });
    expect(searchById.length).toBe(1);
    expect(searchById[0].applicantName).toBe('Hendra Wijaya');

    const filterProduct = await repo.findAll({ product: 'health-guard-essential' });
    expect(filterProduct.length).toBe(2);
  });

  it('should find application by id or return null if not found', async () => {
    const repo = new ApplicationMockRepository();
    const found = await repo.findById('#APP-2026-8819');
    expect(found).not.toBeNull();
    expect(found?.applicantName).toBe('Budi Santoso');

    const notFound = await repo.findById('#APP-NON-EXISTENT');
    expect(notFound).toBeNull();
  });

  it('should update review check and recalculate passed checks count', async () => {
    const repo = new ApplicationMockRepository();
    const updated = await repo.updateReviewCheck(
      '#APP-2026-8820',
      'documents_complete',
      'PASSED',
      'Dokumen lengkap via email'
    );

    expect(updated.reviewChecks.find((c) => c.type === 'documents_complete')?.status).toBe('PASSED');
    expect(updated.passedChecksCount).toBe(4);

    // Test FLAGGED status
    const flagged = await repo.updateReviewCheck(
      '#APP-2026-8820',
      'documents_complete',
      'FLAGGED'
    );
    expect(flagged.reviewChecks.find((c) => c.type === 'documents_complete')?.status).toBe('FLAGGED');

    // Test FAILED status
    const failed = await repo.updateReviewCheck(
      '#APP-2026-8820',
      'documents_complete',
      'FAILED'
    );
    expect(failed.reviewChecks.find((c) => c.type === 'documents_complete')?.status).toBe('FAILED');

    // Test WAIVED status
    const waived = await repo.updateReviewCheck(
      '#APP-2026-8820',
      'medical_required',
      'WAIVED'
    );
    expect(waived.reviewChecks.find((c) => c.type === 'medical_required')?.status).toBe('WAIVED');

    await expect(
      repo.updateReviewCheck('#NON-EXISTENT', 'identity_verified', 'PASSED')
    ).rejects.toThrow();
  });

  it('should update application status for approved, rejected, rfi_requested, and under_review', async () => {
    const repo = new ApplicationMockRepository();

    const approved = await repo.updateStatus('#APP-2026-8819', 'approved', undefined, 'Polis terbit');
    expect(approved.status).toBe('approved');
    expect(approved.statusLabel).toBe('Disetujui');

    const rejected = await repo.updateStatus('#APP-2026-8820', 'rejected', 'Fraud detected');
    expect(rejected.status).toBe('rejected');
    expect(rejected.statusLabel).toBe('Ditolak');

    const rfi = await repo.updateStatus('#APP-2026-8821', 'rfi_requested', 'Need bank statement');
    expect(rfi.status).toBe('rfi_requested');
    expect(rfi.statusLabel).toBe('RFI Terkirim');

    const underReview = await repo.updateStatus('#APP-2026-8823', 'under_review');
    expect(underReview.status).toBe('under_review');
    expect(underReview.statusLabel).toBe('Under Review');

    await expect(repo.updateStatus('#NON-EXISTENT', 'approved')).rejects.toThrow();
  });

  it('should save internal notes and generate an audit hash', async () => {
    const repo = new ApplicationMockRepository();
    const updated = await repo.saveInternalNotes('#APP-2026-8819', 'Catatan baru hasil re-evaluasi');

    expect(updated.internalAuditNotes).toBe('Catatan baru hasil re-evaluasi');
    expect(updated.auditHash).toContain('sha256:');

    await expect(repo.saveInternalNotes('#NON-EXISTENT', 'note')).rejects.toThrow();
  });
});
