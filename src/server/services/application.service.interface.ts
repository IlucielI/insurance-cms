import {
  UnderwritingDossier,
  ApplicationFilterParams,
  PillarType,
  PillarStatus,
} from '../repositories/application.repository.interface';

export interface IApplicationService {
  getQueue(params?: ApplicationFilterParams): Promise<UnderwritingDossier[]>;
  getDossierById(id: string): Promise<UnderwritingDossier | null>;
  overridePillarCheck(
    id: string,
    pillarType: PillarType,
    status: PillarStatus,
    notes?: string
  ): Promise<UnderwritingDossier>;
  approveApplication(
    id: string,
    notes?: string
  ): Promise<UnderwritingDossier>;
  requestDocuments(
    id: string,
    reason: string,
    notes?: string
  ): Promise<UnderwritingDossier>;
  rejectApplication(
    id: string,
    reason: string,
    notes?: string
  ): Promise<UnderwritingDossier>;
  saveInternalNotes(id: string, notes: string): Promise<UnderwritingDossier>;
}
