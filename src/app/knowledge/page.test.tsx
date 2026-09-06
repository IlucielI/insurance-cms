import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KnowledgePage from './page';
import { KnowledgeBaseWorkbench } from './KnowledgeBaseWorkbench';
import { knowledgeService } from '@/server/di';

describe('KnowledgePage & KnowledgeBaseWorkbench', () => {
  it('should render the Server Component KnowledgePage correctly', async () => {
    const Component = await KnowledgePage();
    render(Component);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Knowledge Base AI & Underwriting Copilot' })
    ).toBeDefined();
    expect(screen.getByText('Pedoman Batas Uang Pertanggungan & Medical Check-Up')).toBeDefined();
    expect(screen.getByText('Prosedur Verifikasi Dokumen Dukcapil & Biometrik')).toBeDefined();
    expect(screen.getByText(/Total Vektor Chunks/i)).toBeDefined();
  });

  it('should filter documents by category tabs and search query', async () => {
    const docs = await knowledgeService.getDocuments();
    const metrics = await knowledgeService.getMetrics();

    render(
      <KnowledgeBaseWorkbench initialDocuments={docs} initialMetrics={metrics} />
    );

    // Filter category Underwriting
    const tabUnderwriting = screen.getByRole('button', { name: /^Underwriting/i });
    fireEvent.click(tabUnderwriting);
    expect(screen.getByText('Pedoman Batas Uang Pertanggungan & Medical Check-Up')).toBeDefined();
    expect(screen.queryByText('Prosedur Verifikasi Dokumen Dukcapil & Biometrik')).toBeNull();

    // Filter category Kepatuhan
    const tabCompliance = screen.getByRole('button', { name: /^Kepatuhan & AML/i });
    fireEvent.click(tabCompliance);
    expect(screen.getByText('Prosedur Verifikasi Dokumen Dukcapil & Biometrik')).toBeDefined();
    expect(screen.queryByText('Pedoman Batas Uang Pertanggungan & Medical Check-Up')).toBeNull();

    // Reset filter
    const tabAll = screen.getByRole('button', { name: /^Semua/i });
    fireEvent.click(tabAll);

    // Search query
    const searchInput = screen.getByPlaceholderText(/Cari judul, tag, atau isi dokumen/i);
    fireEvent.change(searchInput, { target: { value: 'Dukcapil' } });
    expect(screen.getByText('Prosedur Verifikasi Dokumen Dukcapil & Biometrik')).toBeDefined();
    expect(screen.queryByText('Pedoman Batas Uang Pertanggungan & Medical Check-Up')).toBeNull();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Pedoman Batas Uang Pertanggungan & Medical Check-Up')).toBeDefined();

    // Search unmatched string shows empty state
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENTDOC123' } });
    expect(screen.getByText('Tidak ada dokumen yang ditemukan')).toBeDefined();

    const resetBtn = screen.getByRole('button', { name: /Reset Filter/i });
    fireEvent.click(resetBtn);
    expect(screen.getByText('Pedoman Batas Uang Pertanggungan & Medical Check-Up')).toBeDefined();
  });

  it('should open and close document detail modal', async () => {
    const docs = await knowledgeService.getDocuments();
    const metrics = await knowledgeService.getMetrics();

    render(
      <KnowledgeBaseWorkbench initialDocuments={docs} initialMetrics={metrics} />
    );

    const detailBtns = screen.getAllByRole('button', { name: /Baca Lengkap/i });
    fireEvent.click(detailBtns[0]);

    expect(screen.getByText('Ringkasan Eksekutif')).toBeDefined();
    expect(screen.getByText('Isi Dokumen')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /Tutup Dokumen/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Ringkasan Eksekutif')).toBeNull();
    });
  });

  it('should open create modal, create new knowledge doc, and dismiss toast', async () => {
    const docs = await knowledgeService.getDocuments();
    const metrics = await knowledgeService.getMetrics();

    render(
      <KnowledgeBaseWorkbench initialDocuments={docs} initialMetrics={metrics} />
    );

    const addBtn = screen.getByRole('button', { name: /Tambah Dokumen Baru/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Tambah Dokumen Knowledge Base')).toBeDefined();

    const titleInput = screen.getByPlaceholderText(/misal: Pedoman Limit Uang Pertanggungan/i);
    fireEvent.change(titleInput, { target: { value: 'SOP Tele-Interview Underwriting 2026' } });

    const summaryInput = screen.getByPlaceholderText(/Ringkasan 1-2 kalimat/i);
    fireEvent.change(summaryInput, { target: { value: 'Prosedur wawancara medis via zoom' } });

    const contentInput = screen.getByPlaceholderText(/Masukkan ketentuan detail SOP/i);
    fireEvent.change(contentInput, {
      target: { value: 'Wawancara direkam dan persetujuan lisan disimpan ke cloud archive.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Indeks Dokumen ✨/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/SOP Tele-Interview Underwriting 2026/i).length).toBeGreaterThan(0);
    });

    const dismissBtn = screen.getByLabelText('Dismiss toast');
    fireEvent.click(dismissBtn);
    expect(screen.queryByLabelText('Dismiss toast')).toBeNull();
  });

  it('should show form error on duplicate slug and allow cancellation', async () => {
    const docs = await knowledgeService.getDocuments();
    const metrics = await knowledgeService.getMetrics();

    render(
      <KnowledgeBaseWorkbench initialDocuments={docs} initialMetrics={metrics} />
    );

    const addBtn = screen.getByRole('button', { name: /Tambah Dokumen Baru/i });
    fireEvent.click(addBtn);

    // Existing title and slug
    const titleInput = screen.getByPlaceholderText(/misal: Pedoman Limit Uang Pertanggungan/i);
    fireEvent.change(titleInput, { target: { value: 'Duplicate Pedoman UP' } });

    const slugInput = screen.getByPlaceholderText(/misal: pedoman-limit-uang-pertanggungan/i);
    fireEvent.change(slugInput, { target: { value: 'pedoman-batas-up-dan-medical-check-up' } });

    const summaryInput = screen.getByPlaceholderText(/Ringkasan 1-2 kalimat/i);
    fireEvent.change(summaryInput, { target: { value: 'Summary' } });

    const contentInput = screen.getByPlaceholderText(/Masukkan ketentuan detail SOP/i);
    fireEvent.change(contentInput, { target: { value: 'Content is long enough for testing.' } });

    const submitBtn = screen.getByRole('button', { name: /Indeks Dokumen ✨/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/sudah ada/i)).toBeDefined();
    });

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText('Tambah Dokumen Knowledge Base')).toBeNull();
  });

  it('should open edit modal and save changes to document', async () => {
    const docs = await knowledgeService.getDocuments();
    const metrics = await knowledgeService.getMetrics();

    render(
      <KnowledgeBaseWorkbench initialDocuments={docs} initialMetrics={metrics} />
    );

    const editBtns = screen.getAllByRole('button', { name: /Edit/i });
    fireEvent.click(editBtns[0]);

    expect(screen.getByText(/Edit Dokumen:/i)).toBeDefined();

    const submitBtn = screen.getByRole('button', { name: /Simpan Perubahan 💾/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/berhasil diperbarui/i)).toBeDefined();
    });
  });

  it('should trigger re-index and delete actions on a document', async () => {
    const docs = await knowledgeService.getDocuments();
    const metrics = await knowledgeService.getMetrics();

    render(
      <KnowledgeBaseWorkbench initialDocuments={docs} initialMetrics={metrics} />
    );

    // Reindex
    const reindexBtns = screen.getAllByRole('button', { name: /Re-index/i });
    fireEvent.click(reindexBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/berhasil di-reindex/i)).toBeDefined();
    });

    // Delete
    const deleteBtn = screen.getByLabelText(/Hapus dokumen Kepatuhan Anti-Pencucian Uang/i);
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/berhasil dihapus/i)).toBeDefined();
    });
  });

  it('should run interactive AI Underwriting Copilot RAG queries and display citations', async () => {
    const docs = await knowledgeService.getDocuments();
    const metrics = await knowledgeService.getMetrics();

    render(
      <KnowledgeBaseWorkbench initialDocuments={docs} initialMetrics={metrics} />
    );

    // Switch to Copilot Playground tab
    const copilotTab = screen.getByRole('button', { name: /AI Underwriting Copilot Playground/i });
    fireEvent.click(copilotTab);

    expect(screen.getByText('Simulasi Inferensi RAG & Underwriting Copilot')).toBeDefined();

    // Click sample prompt
    const samplePromptBtn = screen.getByRole('button', {
      name: /Berapa batas UP tanpa medical check-up\?/i,
    });
    fireEvent.click(samplePromptBtn);

    await waitFor(() => {
      expect(screen.getByText('Jawaban AI Underwriting Copilot')).toBeDefined();
      expect(screen.getByText(/Sumber Rujukan Dokumen/i)).toBeDefined();
      expect(screen.getAllByText(/Match/i).length).toBeGreaterThan(0);
    });

    // Custom query via input with Enter key
    const chatInput = screen.getByPlaceholderText(/Ketik pertanyaan underwriting/i);
    fireEvent.change(chatInput, { target: { value: 'Bagaimana alur klaim rawat inap?' } });

    // Category select in copilot
    const copilotCatSelect = screen.getByLabelText(/Filter kategori RAG/i);
    fireEvent.change(copilotCatSelect, { target: { value: 'claim_faq' } });

    fireEvent.keyDown(chatInput, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Riwayat Pertanyaan Terbaru/i)).toBeDefined();
    });

    // Click recent query history item
    const historyItem = screen.getByText(/💬 Bagaimana alur klaim rawat inap\?/i);
    fireEvent.click(historyItem);
  });
});
