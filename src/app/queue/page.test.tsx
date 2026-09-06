import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QueuePage from './page';
import { UnderwritingWorkbench } from './UnderwritingWorkbench';
import { applicationService } from '@/server/di';

describe('QueuePage & UnderwritingWorkbench', () => {
  it('should render the Server Component QueuePage correctly without searchParams', async () => {
    const Component = await QueuePage({});
    render(Component);

    expect(screen.getByText('Underwriting & Verification Workbench')).toBeDefined();
    expect(screen.getByText('Daftar Antrean Aktif (7)')).toBeDefined();
  });

  it('should render with initialSelectedId from searchParams deep-link', async () => {
    const Component = await QueuePage({
      searchParams: Promise.resolve({ id: '#APP-2026-8821' }),
    });
    render(Component);

    expect(screen.getByText('Pemohon: Hendra Wijaya (41 Thn) • Auto Shield Comprehensive • UP: Rp 380.000.000')).toBeDefined();
  });

  it('should filter queue items by status tabs, search query, and product dropdown', async () => {
    const initialQueue = await applicationService.getQueue();
    render(<UnderwritingWorkbench initialQueue={initialQueue} />);

    // 1. Tab filtering
    const tabReview = screen.getByText(/Perlu Review/i);
    fireEvent.click(tabReview);
    expect(screen.getByText('Budi Santoso (34)')).toBeDefined();

    const tabApproved = screen.getByText(/Disetujui/i);
    fireEvent.click(tabApproved);
    expect(screen.getByText('Agus Kurniawan (38)')).toBeDefined();

    const tabAll = screen.getByRole('button', { name: /^Semua/i });
    fireEvent.click(tabAll);

    // 2. Search query filtering
    const searchInput = screen.getByPlaceholderText(/Cari nomor aplikasi \/ NIK/i);
    fireEvent.change(searchInput, { target: { value: 'Maya' } });
    expect(screen.getByText('Maya Anggraini (33)')).toBeDefined();

    fireEvent.change(searchInput, { target: { value: '' } });

    // 3. Product dropdown filtering
    const productSelect = screen.getByRole('combobox');
    fireEvent.change(productSelect, { target: { value: 'auto-shield-comprehensive' } });
    expect(screen.getByText('Hendra Wijaya (41)')).toBeDefined();
  });

  it('should change active dossier when clicking an item from the queue list', async () => {
    const initialQueue = await applicationService.getQueue();
    render(<UnderwritingWorkbench initialQueue={initialQueue} />);

    // Click Hendra Wijaya card
    const hendraItem = screen.getByText('Hendra Wijaya (41)');
    fireEvent.click(hendraItem);

    expect(screen.getByText('Pemohon: Hendra Wijaya (41 Thn) • Auto Shield Comprehensive • UP: Rp 380.000.000')).toBeDefined();
    expect(screen.getByText(/Skor Risiko: 81 \(B\+\)/i)).toBeDefined();
  });

  it('should open and confirm approval through ApproveModal', async () => {
    const initialQueue = await applicationService.getQueue();
    render(<UnderwritingWorkbench initialQueue={initialQueue} />);

    // Click Approve button in decision box
    const approveBtn = screen.getByText('Setujui & Terbitkan Polis');
    fireEvent.click(approveBtn);

    // ApproveModal is now open
    expect(screen.getByText('Persetujuan & Penerbitan Polis Final')).toBeDefined();

    // Confirm approval
    const confirmBtn = screen.getByText(/Konfirmasi & Terbitkan Polis Resmi/i);
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/berhasil disetujui & diterbitkan/i)).toBeDefined();
    });
  });

  it('should open and submit RFIModal for additional documents', async () => {
    const initialQueue = await applicationService.getQueue();
    render(<UnderwritingWorkbench initialQueue={initialQueue} />);

    // Click RFI button in decision box
    const rfiBtn = screen.getByText('Minta Dokumen Tambahan');
    fireEvent.click(rfiBtn);

    // RFIModal is now open
    expect(screen.getByText('Permintaan Dokumen Tambahan ke Nasabah')).toBeDefined();

    // Submit RFI
    const submitRfiBtn = screen.getByText(/Kirim Permintaan Dokumen Tambahan/i);
    fireEvent.click(submitRfiBtn);

    await waitFor(() => {
      expect(screen.getByText(/Permintaan dokumen untuk .* berhasil dikirim/i)).toBeDefined();
    });
  });

  it('should open and submit RejectModal with PIN entered', async () => {
    const initialQueue = await applicationService.getQueue();
    render(<UnderwritingWorkbench initialQueue={initialQueue} />);

    // Click Reject button in decision box
    const rejectBtn = screen.getByText('Tolak Pengajuan');
    fireEvent.click(rejectBtn);

    // RejectModal is now open
    expect(screen.getByText('Penolakan Aplikasi Polis Asuransi')).toBeDefined();

    // Fill PIN input
    const pinInput = screen.getByPlaceholderText('Masukkan PIN keamanan...');
    fireEvent.change(pinInput, { target: { value: '1234' } });

    // Submit Reject
    const submitRejectBtn = screen.getByText(/Konfirmasi Tolak Pengajuan Resmi/i);
    fireEvent.click(submitRejectBtn);

    await waitFor(() => {
      expect(screen.getByText(/berhasil ditolak/i)).toBeDefined();
    });
  });

  it('should open and submit ManualOverrideModal on a review check', async () => {
    const initialQueue = await applicationService.getQueue();
    render(<UnderwritingWorkbench initialQueue={initialQueue} />);

    // Click first "Ubah Status ⚙️"
    const overrideButtons = screen.getAllByText('Ubah Status ⚙️');
    fireEvent.click(overrideButtons[0]);

    // ManualOverrideModal is open
    expect(screen.getByText('Ubah Status & Manual Override Pilar Verifikasi')).toBeDefined();

    // Submit override
    const saveOverrideBtn = screen.getByText('Terapkan Perubahan Status Pilar & Perbarui Antrean 💾');
    fireEvent.click(saveOverrideBtn);

    await waitFor(() => {
      expect(screen.getByText(/diperbarui menjadi/i)).toBeDefined();
    });
  });

  it('should save internal notes when clicking Simpan Keputusan button', async () => {
    const initialQueue = await applicationService.getQueue();
    render(<UnderwritingWorkbench initialQueue={initialQueue} />);

    const textarea = screen.getByLabelText(/Catatan Audit Underwriter/i);
    fireEvent.change(textarea, { target: { value: 'Catatan terupdate oleh lead underwriter.' } });

    const saveBtn = screen.getByText('Simpan Keputusan 💾');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Catatan audit internal untuk .* berhasil disimpan/i)).toBeDefined();
    });
  });

  it('should handle toast dismiss, sync button, and empty search state', async () => {
    const initialQueue = await applicationService.getQueue();
    render(<UnderwritingWorkbench initialQueue={initialQueue} />);

    // Click Sync button
    const syncBtn = screen.getByText('Sync Antrean');
    fireEvent.click(syncBtn);
    expect(screen.getByText(/Sinkronisasi data antrean Core API berhasil/i)).toBeDefined();

    // Dismiss toast
    const dismissBtn = screen.getByLabelText(/Dismiss toast/i);
    fireEvent.click(dismissBtn);

    // Search for non-existent name
    const searchInput = screen.getByPlaceholderText(/Cari nomor aplikasi \/ NIK/i);
    fireEvent.change(searchInput, { target: { value: 'ZZZZNOTFOUND' } });
    expect(
      screen.getByText('Tidak ada pengajuan yang sesuai dengan kriteria filter.')
    ).toBeDefined();

    // Tab Rejected
    fireEvent.change(searchInput, { target: { value: '' } });
    const tabRejected = screen.getByRole('button', { name: /^Ditolak/i });
    fireEvent.click(tabRejected);
    expect(screen.getByText('Rina Setyowati (45)')).toBeDefined();
  });
});
