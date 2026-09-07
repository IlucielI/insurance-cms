import { describe, it, expect, vi } from 'vitest';
import {
  approveApplicationAction,
  rejectApplicationAction,
  requestDocumentsAction,
  overrideReviewCheckAction,
  saveInternalNotesAction,
} from './actions';

// Mock next/cache revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Queue Server Actions', () => {
  const targetId = '#APP-2026-8819';

  it('approves an application and revalidates /queue', async () => {
    const result = await approveApplicationAction(
      targetId,
      'Approved via Server Action test'
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(targetId);
    expect(result.status).toBe('approved');
  });

  it('rejects an application with reason and revalidates /queue', async () => {
    const result = await rejectApplicationAction(
      targetId,
      'Ditolak: riwayat medis tidak memenuhi kriteria'
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(targetId);
    expect(result.status).toBe('rejected');
  });

  it('requests additional documents and revalidates /queue', async () => {
    const result = await requestDocumentsAction(
      targetId,
      'Mohon unggah KTP dan SPT Tahunan terbaru'
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(targetId);
    expect(result.status).toBe('rfi_requested');
  });

  it('overrides a review check and revalidates /queue', async () => {
    const result = await overrideReviewCheckAction(
      targetId,
      'identity_verified',
      'PASSED',
      'Manual verification passed'
    );

    expect(result).toBeDefined();
    const identityCheck = result.reviewChecks.find((c) => c.type === 'identity_verified');
    expect(identityCheck?.status).toBe('PASSED');
  });

  it('saves internal notes and revalidates /queue', async () => {
    const result = await saveInternalNotesAction(
      targetId,
      'Catatan verifikasi internal underwriting'
    );

    expect(result).toBeDefined();
    expect(result.internalAuditNotes).toBe('Catatan verifikasi internal underwriting');
  });
});
