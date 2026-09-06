export type PillarType =
  | 'identity_verified'
  | 'income_verified'
  | 'documents_complete'
  | 'medical_required';

export type PillarStatus =
  | 'PASSED'
  | 'FLAGGED'
  | 'FAILED'
  | 'WAIVED'
  | 'NOT_NEEDED'
  | 'UNDER_REVIEW'
  | 'REJECTED';

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'rfi_requested';

export interface ApplicationReviewCheck {
  type: PillarType;
  title: string;
  status: PillarStatus;
  statusBg: string;
  statusColor: string;
  details: string;
  reviewer: string;
}

export interface UnderwritingDossier {
  id: string;
  applicantName: string;
  applicantAge: number;
  nik: string;
  productName: string;
  productSlug: string;
  sumAssured: string;
  status: ApplicationStatus;
  statusLabel: string;
  riskScore: number;
  riskGrade: string;
  slaRemainingMinutes: number;
  slaText: string;
  slaColor: string;
  monthlyPremium: string;
  tenorYears: number;
  paymentMethod: string;
  autoDebet: boolean;
  beneficiaryName: string;
  beneficiaryRelation: string;
  beneficiarySharePct: number;
  reviewChecks: ApplicationReviewCheck[];
  passedChecksCount: number;
  totalChecksCount: number;
  internalAuditNotes: string;
  auditSignature: string;
  auditHash: string;
}

export interface ApplicationFilterParams {
  status?: string;
  search?: string;
  product?: string;
}

export interface IApplicationRepository {
  findAll(params?: ApplicationFilterParams): Promise<UnderwritingDossier[]>;
  findById(id: string): Promise<UnderwritingDossier | null>;
  updateReviewCheck(
    id: string,
    pillarType: PillarType,
    status: PillarStatus,
    notes?: string
  ): Promise<UnderwritingDossier>;
  updateStatus(
    id: string,
    newStatus: ApplicationStatus,
    reason?: string,
    notes?: string
  ): Promise<UnderwritingDossier>;
  saveInternalNotes(id: string, notes: string): Promise<UnderwritingDossier>;
}
