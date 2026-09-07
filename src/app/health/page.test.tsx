import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HealthPage from './page';
import { SystemHealthWorkbench } from './SystemHealthWorkbench';
import { healthAuditService } from '@/server/di';

describe('HealthPage & SystemHealthWorkbench', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Server Component HealthPage correctly', async () => {
    const Component = await HealthPage();
    render(Component);

    expect(
      screen.getByRole('heading', { level: 1, name: 'System Health & Audit Trail' })
    ).toBeDefined();
    expect(screen.getByText('Core API Backend (Go Fiber)')).toBeDefined();
    expect(screen.getByText('PostgreSQL 16 & pgvector DB')).toBeDefined();
    expect(screen.getByText('Redis Distributed Cache')).toBeDefined();
    expect(screen.getByText('Dukcapil OCR & Liveness Gateway')).toBeDefined();
    expect(screen.getByText('SMTP Relay & e-Policy Dispatcher')).toBeDefined();
    expect(screen.getByText('Latensi Jaringan Rata-Rata')).toBeDefined();
  });

  it('pings all services and displays success feedback toast', async () => {
    const overview = await healthAuditService.getSystemOverview();
    render(<SystemHealthWorkbench initialOverview={overview} />);

    const pingAllBtn = screen.getByRole('button', { name: /Ping Seluruh Layanan/i });
    fireEvent.click(pingAllBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Seluruh layanan berhasil diperiksa (health check ping selesai).')
      ).toBeDefined();
    });

    // Dismiss toast
    const dismissBtn = screen.getByRole('button', { name: 'Dismiss toast' });
    fireEvent.click(dismissBtn);
    expect(
      screen.queryByText('Seluruh layanan berhasil diperiksa (health check ping selesai).')
    ).toBeNull();
  });

  it('handles ping all failure gracefully when service throws', async () => {
    const overview = await healthAuditService.getSystemOverview();
    vi.spyOn(healthAuditService, 'pingServices').mockRejectedValueOnce(new Error('Network error'));

    render(<SystemHealthWorkbench initialOverview={overview} />);

    const pingAllBtn = screen.getByRole('button', { name: /Ping Seluruh Layanan/i });
    fireEvent.click(pingAllBtn);

    await waitFor(() => {
      expect(screen.getByText('Gagal melakukan ping ke beberapa layanan.')).toBeDefined();
    });
  });

  it('pings an individual service when its ping button is clicked', async () => {
    const overview = await healthAuditService.getSystemOverview();
    const pingSingleSpy = vi.spyOn(healthAuditService, 'pingSingleService');

    render(<SystemHealthWorkbench initialOverview={overview} />);

    const singlePingBtns = screen.getAllByRole('button', { name: 'Ping Layanan' });
    fireEvent.click(singlePingBtns[0]);

    await waitFor(() => {
      expect(pingSingleSpy).toHaveBeenCalledWith('service_core_api');
      expect(screen.getByText(/berhasil diperiksa/i)).toBeDefined();
    });
  });

  it('handles single ping failure gracefully when service throws', async () => {
    const overview = await healthAuditService.getSystemOverview();
    vi.spyOn(healthAuditService, 'pingSingleService').mockRejectedValueOnce(new Error('Timeout'));

    render(<SystemHealthWorkbench initialOverview={overview} />);

    const singlePingBtns = screen.getAllByRole('button', { name: 'Ping Layanan' });
    fireEvent.click(singlePingBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Gagal memeriksa status layanan.')).toBeDefined();
    });
  });

  it('filters audit logs by category dropdown', async () => {
    const overview = await healthAuditService.getSystemOverview();
    render(<SystemHealthWorkbench initialOverview={overview} />);

    const categorySelect = screen.getByLabelText('Filter Kategori');
    fireEvent.change(categorySelect, { target: { value: 'knowledge' } });

    expect(screen.getByText('REINDEX_VECTOR_CHUNK')).toBeDefined();
    expect(screen.getByText('CREATE_KNOWLEDGE_DOC')).toBeDefined();
    expect(screen.queryByText('APPROVE_APPLICATION')).toBeNull();

    // Switch back to all
    fireEvent.change(categorySelect, { target: { value: 'all' } });
    expect(screen.getByText('APPROVE_APPLICATION')).toBeDefined();
  });

  it('filters audit logs by status dropdown', async () => {
    const overview = await healthAuditService.getSystemOverview();
    render(<SystemHealthWorkbench initialOverview={overview} />);

    const statusSelect = screen.getByLabelText('Filter Status');
    fireEvent.change(statusSelect, { target: { value: 'WARNING' } });

    expect(screen.getByText('MANUAL_OVERRIDE_CHECK')).toBeDefined();
    expect(screen.queryByText('APPROVE_APPLICATION')).toBeNull();

    fireEvent.change(statusSelect, { target: { value: 'FAILED' } });
    expect(screen.getByText('REJECT_APPLICATION')).toBeDefined();
    expect(screen.getByText('SECURITY_PIN_FAILURE')).toBeDefined();
  });

  it('searches audit logs by search query and shows empty state when nothing matches', async () => {
    const overview = await healthAuditService.getSystemOverview();
    render(<SystemHealthWorkbench initialOverview={overview} />);

    const searchInput = screen.getByPlaceholderText(/Cari berdasarkan nama staf/i);
    fireEvent.change(searchInput, { target: { value: '192.168.10.45' } });

    expect(screen.getByText('APPROVE_APPLICATION')).toBeDefined();
    expect(screen.queryByText('SECURITY_PIN_FAILURE')).toBeNull();

    // Query non-existent
    fireEvent.change(searchInput, { target: { value: 'UNKNOWN_9999999' } });
    expect(screen.getByText('Tidak ada catatan log audit yang cocok.')).toBeDefined();
  });

  it('opens inspector modal, copies JSON, and closes modal', async () => {
    // Mock navigator.clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const overview = await healthAuditService.getSystemOverview();
    render(<SystemHealthWorkbench initialOverview={overview} />);

    const inspectBtns = screen.getAllByRole('button', { name: 'Inspeksi' });
    fireEvent.click(inspectBtns[0]);

    expect(screen.getByText('Inspeksi Audit Trail Log')).toBeDefined();
    expect(screen.getByText('Metadata & Payload Rinci (JSON)')).toBeDefined();

    // Copy JSON
    const copyBtn = screen.getByRole('button', { name: 'Salin JSON' });
    fireEvent.click(copyBtn);
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      expect(screen.getByText('Payload detail audit log berhasil disalin ke clipboard.')).toBeDefined();
    });

    // Close modal via Tutup button
    const closeBtn = screen.getByRole('button', { name: 'Tutup' });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Inspeksi Audit Trail Log')).toBeNull();
    });
  });

  it('handles copy JSON failure gracefully when clipboard throws', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    const overview = await healthAuditService.getSystemOverview();
    render(<SystemHealthWorkbench initialOverview={overview} />);

    const inspectBtns = screen.getAllByRole('button', { name: 'Inspeksi' });
    fireEvent.click(inspectBtns[0]);

    const copyBtn = screen.getByRole('button', { name: 'Salin JSON' });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText('Gagal menyalin ke clipboard.')).toBeDefined();
    });

    // Close modal via X button
    const closeXBtn = screen.getByRole('button', { name: /tutup dialog|tutup modal/i });
    fireEvent.click(closeXBtn);
    expect(screen.queryByText('Inspeksi Audit Trail Log')).toBeNull();
  });

  it('renders Penpot infrastructure metric cards with correct SLA badges', async () => {
    const overview = await healthAuditService.getSystemOverview();
    render(<SystemHealthWorkbench initialOverview={overview} />);

    expect(screen.getByText('Status Go Fiber Core API')).toBeDefined();
    expect(screen.getByText('200 OK')).toBeDefined();
    expect(screen.getByText(/Git: 9a4f2b1/i)).toBeDefined();

    expect(screen.getByText('Uptime Ketersediaan')).toBeDefined();
    expect(screen.getByText('99.98%')).toBeDefined();
    expect(screen.getByText(/342j 18m aktif tanpa restart/i)).toBeDefined();

    expect(screen.getByText('PostgreSQL DB Connection')).toBeDefined();
    expect(screen.getByText('12 / 50 Pool')).toBeDefined();

    expect(screen.getByText('Audit Trail Underwriting')).toBeDefined();
    expect(screen.getByText('4,892 Logs')).toBeDefined();
    expect(screen.getByText('SHA-256 Tamper-Proof')).toBeDefined();
  });

  it('exports audit trail as a downloadable JSON file and displays success toast', async () => {
    // Mock URL.createObjectURL and revokeObjectURL
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/dummy');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const overview = await healthAuditService.getSystemOverview();
    render(<SystemHealthWorkbench initialOverview={overview} />);

    const exportBtn = screen.getByRole('button', { name: 'Ekspor Audit Trail' });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(screen.getByText(/Log audit trail berhasil diekspor/i)).toBeDefined();
    });
  });

  it('pings an individual API route and shows route responsive toast', async () => {
    const overview = await healthAuditService.getSystemOverview();
    render(<SystemHealthWorkbench initialOverview={overview} />);

    const routePingBtns = screen.getAllByRole('button', { name: 'Ping Rute' });
    expect(routePingBtns.length).toBeGreaterThan(0);

    fireEvent.click(routePingBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/responsif dengan status 200 OK/i)).toBeDefined();
    });
  });
});
