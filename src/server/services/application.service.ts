import { IApplicationService } from './application.service.interface';
import {
  IApplicationRepository,
  UnderwritingDossier,
  ApplicationFilterParams,
  PillarType,
  PillarStatus,
} from '../repositories/application.repository.interface';

export class ApplicationService implements IApplicationService {
  constructor(private readonly applicationRepository: IApplicationRepository) {}

  async getQueue(params?: ApplicationFilterParams): Promise<UnderwritingDossier[]> {
    return this.applicationRepository.findAll(params);
  }

  async getDossierById(id: string): Promise<UnderwritingDossier | null> {
    return this.applicationRepository.findById(id);
  }

  async overridePillarCheck(
    id: string,
    pillarType: PillarType,
    status: PillarStatus,
    notes?: string
  ): Promise<UnderwritingDossier> {
    return this.applicationRepository.updateReviewCheck(id, pillarType, status, notes);
  }

  async approveApplication(
    id: string,
    notes?: string
  ): Promise<UnderwritingDossier> {
    return this.applicationRepository.updateStatus(id, 'approved', 'Disetujui Lead Underwriter', notes);
  }

  async requestDocuments(
    id: string,
    reason: string,
    notes?: string
  ): Promise<UnderwritingDossier> {
    return this.applicationRepository.updateStatus(id, 'rfi_requested', reason, notes);
  }

  async rejectApplication(
    id: string,
    reason: string,
    notes?: string
  ): Promise<UnderwritingDossier> {
    return this.applicationRepository.updateStatus(id, 'rejected', reason, notes);
  }

  async saveInternalNotes(id: string, notes: string): Promise<UnderwritingDossier> {
    return this.applicationRepository.saveInternalNotes(id, notes);
  }
}
