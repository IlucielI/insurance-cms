'use server';

import { revalidatePath } from 'next/cache';
import { applicationService } from '@/server/di';
import {
  PillarType,
  PillarStatus,
  UnderwritingDossier,
} from '@/server/repositories/application.repository.interface';

function safeRevalidateQueue() {
  try {
    revalidatePath('/queue');
  } catch {
    // Ignore when called outside Next.js request context (e.g. in test environment)
  }
}

// Server Action to approve an application and issue digital policy.
export async function approveApplicationAction(
  id: string,
  notes?: string
): Promise<UnderwritingDossier> {
  const updated = await applicationService.approveApplication(id, notes);
  safeRevalidateQueue();
  return updated;
}

// Server Action to reject an application with an underwriting reason.
export async function rejectApplicationAction(
  id: string,
  reason: string,
  notes?: string
): Promise<UnderwritingDossier> {
  const updated = await applicationService.rejectApplication(id, reason, notes);
  safeRevalidateQueue();
  return updated;
}

// Server Action to request additional verification documents (RFI).
export async function requestDocumentsAction(
  id: string,
  reason: string,
  notes?: string
): Promise<UnderwritingDossier> {
  const updated = await applicationService.requestDocuments(id, reason, notes);
  safeRevalidateQueue();
  return updated;
}

// Server Action to manually override a pillar review check.
export async function overrideReviewCheckAction(
  id: string,
  pillarType: PillarType,
  status: PillarStatus,
  notes?: string
): Promise<UnderwritingDossier> {
  const updated = await applicationService.overridePillarCheck(id, pillarType, status, notes);
  safeRevalidateQueue();
  return updated;
}

// Server Action to persist internal underwriter audit notes.
export async function saveInternalNotesAction(
  id: string,
  notes: string
): Promise<UnderwritingDossier> {
  const updated = await applicationService.saveInternalNotes(id, notes);
  safeRevalidateQueue();
  return updated;
}
