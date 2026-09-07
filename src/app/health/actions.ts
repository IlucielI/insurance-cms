'use server';

import { revalidatePath } from 'next/cache';
import { healthAuditService } from '@/server/di';
import type {
  ServiceHealthItem,
  SystemHealthOverview,
  AuditLogEntry,
  AuditSeverity,
} from '@/server/repositories/health.repository.interface';

function safeRevalidateHealth() {
  try {
    revalidatePath('/health');
  } catch {
    // Ignore outside Next.js request context (e.g. in test environment)
  }
}

// Server Action to ping all services or a specific service by ID
export async function pingServicesAction(
  serviceId?: string
): Promise<ServiceHealthItem[]> {
  const services = await healthAuditService.pingServices(serviceId);
  safeRevalidateHealth();
  return services;
}

// Server Action to ping an individual service by ID
export async function pingSingleServiceAction(
  serviceId: string
): Promise<ServiceHealthItem | null> {
  const service = await healthAuditService.pingSingleService(serviceId);
  safeRevalidateHealth();
  return service;
}

// Server Action to fetch the latest overall system health overview
export async function fetchSystemOverviewAction(): Promise<SystemHealthOverview> {
  return healthAuditService.getSystemOverview();
}

// Server Action to query audit logs with filters
export async function fetchAuditLogsAction(
  category?: string,
  status?: AuditSeverity,
  search?: string
): Promise<AuditLogEntry[]> {
  return healthAuditService.getAuditLogs(category, status, search);
}

// Server Action to fetch single audit log detail by ID
export async function fetchAuditLogByIdAction(
  id: string
): Promise<AuditLogEntry | null> {
  return healthAuditService.getAuditLogById(id);
}
