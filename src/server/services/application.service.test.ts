import { describe, it, expect, vi } from 'vitest';
import { ApplicationService } from './application.service';
import {
  IApplicationRepository,
  UnderwritingDossier,
} from '../repositories/application.repository.interface';

describe('ApplicationService', () => {
  const dummyDossier: UnderwritingDossier = {
    id: '#APP-TEST',
    applicantName: 'Test Applicant',
    applicantAge: 30,
    nik: '1234567890123456',
    productName: 'Secure Life Plus',
    productSlug: 'secure-life-plus',
    sumAssured: 'Rp 500.000.000',
    status: 'under_review',
    statusLabel: 'Under Review',
    riskScore: 90,
    riskGrade: 'A',
    slaRemainingMinutes: 20,
    slaText: '20 min',
    slaColor: '#10b981',
    monthlyPremium: 'Rp 400.000',
    tenorYears: 10,
    paymentMethod: 'VA Mandiri',
    autoDebet: true,
    beneficiaryName: 'Beneficiary',
    beneficiaryRelation: 'Spouse',
    beneficiarySharePct: 100,
    passedChecksCount: 4,
    totalChecksCount: 4,
    internalAuditNotes: 'Test note',
    auditSignature: 'Bayu Pratama',
    auditHash: 'sha256:test',
    reviewChecks: [],
  };

  const mockRepo: IApplicationRepository = {
    findAll: vi.fn().mockResolvedValue([dummyDossier]),
    findById: vi.fn().mockResolvedValue(dummyDossier),
    updateReviewCheck: vi.fn().mockResolvedValue(dummyDossier),
    updateStatus: vi.fn().mockResolvedValue(dummyDossier),
    saveInternalNotes: vi.fn().mockResolvedValue(dummyDossier),
  };

  const service = new ApplicationService(mockRepo);

  it('should call repository methods correctly', async () => {
    const queue = await service.getQueue({ status: 'all' });
    expect(mockRepo.findAll).toHaveBeenCalledWith({ status: 'all' });
    expect(queue).toHaveLength(1);

    const dossier = await service.getDossierById('#APP-TEST');
    expect(mockRepo.findById).toHaveBeenCalledWith('#APP-TEST');
    expect(dossier?.id).toBe('#APP-TEST');

    await service.overridePillarCheck('#APP-TEST', 'identity_verified', 'PASSED', 'Ok');
    expect(mockRepo.updateReviewCheck).toHaveBeenCalledWith(
      '#APP-TEST',
      'identity_verified',
      'PASSED',
      'Ok'
    );

    await service.approveApplication('#APP-TEST', 'Approved notes');
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      '#APP-TEST',
      'approved',
      'Disetujui Lead Underwriter',
      'Approved notes'
    );

    await service.requestDocuments('#APP-TEST', 'Need docs', 'RFI note');
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      '#APP-TEST',
      'rfi_requested',
      'Need docs',
      'RFI note'
    );

    await service.rejectApplication('#APP-TEST', 'Exceeded limit', 'Reject note');
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      '#APP-TEST',
      'rejected',
      'Exceeded limit',
      'Reject note'
    );

    await service.saveInternalNotes('#APP-TEST', 'New notes');
    expect(mockRepo.saveInternalNotes).toHaveBeenCalledWith('#APP-TEST', 'New notes');
  });
});
