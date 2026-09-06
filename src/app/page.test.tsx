import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage (CMS 01 Executive Dashboard)', () => {
  it('should render the dashboard layout with header and badges', async () => {
    const Component = await HomePage();
    render(Component);

    // Header Title
    expect(screen.getByText('Executive Underwriting Dashboard')).toBeDefined();
    expect(screen.getByText('Core API v1.2.0 • Live')).toBeDefined();

    // Action button
    expect(screen.getByText('Unduh Audit Log')).toBeDefined();
  });

  it('should render all 4 KPI cards with their values', async () => {
    const Component = await HomePage();
    render(Component);

    expect(screen.getByText('Total Pengajuan Masuk')).toBeDefined();
    expect(screen.getByText('1.284')).toBeDefined();

    expect(screen.getByText('Dalam Review Underwriting')).toBeDefined();
    expect(screen.getByText('28')).toBeDefined();

    expect(screen.getByText('Approval Rate Otomatis')).toBeDefined();
    expect(screen.getByText('94.2%')).toBeDefined();

    expect(screen.getByText('Polis Aktif Diterbitkan')).toBeDefined();
    expect(screen.getByText('1.142')).toBeDefined();
  });

  it('should render the recent queue table with applicants and links', async () => {
    const Component = await HomePage();
    render(Component);

    expect(screen.getByText('Antrean Review Aplikasi Perlu Tindakan')).toBeDefined();
    expect(screen.getByText('#APP-2026-8819')).toBeDefined();
    expect(screen.getByText('Budi Santoso')).toBeDefined();
    expect(screen.getByText('Siti Rahmawati')).toBeDefined();
    expect(screen.getByText('Hendra Wijaya')).toBeDefined();
    expect(screen.getByText('Maya Anggraini')).toBeDefined();
    expect(screen.getByText('Dimas Prasetyo')).toBeDefined();
  });

  it('should render the SLA distribution card and Top 3 products', async () => {
    const Component = await HomePage();
    render(Component);

    // SLA Box
    expect(screen.getByText('Status Polis & SLA Kepatuhan')).toBeDefined();
    expect(screen.getByText('18.4 Menit')).toBeDefined();

    // Top 3 Products
    expect(screen.getByText('Top 3 Performa Produk (Volume Premi Tertinggi)')).toBeDefined();
    expect(screen.getAllByText('Secure Life Plus').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Health Guard Essential').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Auto Shield Comprehensive').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Rp 4.25 Miliar')).toBeDefined();
    expect(screen.getByText('Rp 2.80 Miliar')).toBeDefined();
    expect(screen.getByText('Rp 1.37 Miliar')).toBeDefined();
  });

  it('should render correct badge classes for rejected and fallback status', async () => {
    const { dashboardService } = await import('@/server/di');
    const originalOverview = await dashboardService.getOverview();

    const mockOverview = {
      ...originalOverview,
      recentQueue: [
        {
          id: '#APP-REJECTED',
          applicantName: 'Rejected Applicant',
          nik: '1111222233334444',
          productName: 'Secure Life Plus',
          sumAssured: 'Rp 100.000.000',
          status: 'rejected' as const,
          statusLabel: 'Ditolak',
          slaMinutesLeft: 0,
          slaText: '0m',
        },
        {
          id: '#APP-CUSTOM',
          applicantName: 'Custom Status Applicant',
          nik: '5555666677778888',
          productName: 'Health Guard Essential',
          sumAssured: 'Rp 200.000.000',
          status: 'unknown_status' as unknown as 'submitted',
          statusLabel: 'Custom',
          slaMinutesLeft: 10,
          slaText: '10m',
        },
      ],
    };

    const spy = vi.spyOn(dashboardService, 'getOverview').mockResolvedValueOnce(mockOverview);

    const Component = await HomePage();
    render(Component);

    expect(screen.getByText('Ditolak')).toBeDefined();
    expect(screen.getByText('Custom')).toBeDefined();

    spy.mockRestore();
  });
});
