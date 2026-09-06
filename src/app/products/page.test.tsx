import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductsPage from './page';
import { ProductManagementWorkbench } from './ProductManagementWorkbench';
import { productService } from '@/server/di';

describe('ProductsPage & ProductManagementWorkbench', () => {
  it('should render the Server Component ProductsPage correctly', async () => {
    const Component = await ProductsPage();
    render(Component);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Manajemen Produk & Aturan Underwriting' })
    ).toBeDefined();
    expect(screen.getByText(/Total Portofolio Premi \(GWP\)/i)).toBeDefined();
    expect(screen.getByText('Secure Life Plus')).toBeDefined();
    expect(screen.getByText('Health Guard Essential')).toBeDefined();
    expect(screen.getByText('Auto Shield Comprehensive')).toBeDefined();
  });

  it('should filter products by category tab and status dropdown', async () => {
    const products = await productService.getProducts();
    const metrics = await productService.getProductMetrics();

    render(
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    );

    // Filter category to Jiwa
    const tabJiwa = screen.getByRole('button', { name: /^Jiwa/i });
    fireEvent.click(tabJiwa);
    expect(screen.getByText('Secure Life Plus')).toBeDefined();
    expect(screen.queryByText('Auto Shield Comprehensive')).toBeNull();

    // Filter category to Kendaraan
    const tabVehicle = screen.getByRole('button', { name: /^Kendaraan/i });
    fireEvent.click(tabVehicle);
    expect(screen.getByText('Auto Shield Comprehensive')).toBeDefined();
    expect(screen.queryByText('Secure Life Plus')).toBeNull();

    // Reset to Semua
    const tabAll = screen.getByRole('button', { name: /^Semua/i });
    fireEvent.click(tabAll);

    // Status filter dropdown
    const statusSelect = screen.getByLabelText(/Filter status produk/i);
    fireEvent.change(statusSelect, { target: { value: 'draft' } });
    expect(screen.getByText('Critical Care Shield')).toBeDefined();
    expect(screen.queryByText('Secure Life Plus')).toBeNull();

    fireEvent.change(statusSelect, { target: { value: 'all' } });
    expect(screen.getByText('Secure Life Plus')).toBeDefined();
  });

  it('should filter products using search input', async () => {
    const products = await productService.getProducts();
    const metrics = await productService.getProductMetrics();

    render(
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari nama, slug, benefit.../i);
    fireEvent.change(searchInput, { target: { value: 'Health' } });

    expect(screen.getByText('Health Guard Essential')).toBeDefined();
    expect(screen.queryByText('Auto Shield Comprehensive')).toBeNull();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Auto Shield Comprehensive')).toBeDefined();

    // Empty search match shows empty state
    fireEvent.change(searchInput, { target: { value: 'XYZNOTFOUND123' } });
    expect(screen.getByText('Tidak ada produk yang sesuai kriteria')).toBeDefined();

    // Click reset filter button
    const resetBtn = screen.getByRole('button', { name: /Reset Semua Filter/i });
    fireEvent.click(resetBtn);
    expect(screen.getByText('Secure Life Plus')).toBeDefined();
  });

  it('should toggle product status using the switch button', async () => {
    const products = await productService.getProducts();
    const metrics = await productService.getProductMetrics();

    render(
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    );

    const toggleBtn = screen.getByLabelText(/Toggle status untuk Secure Life Plus/i);
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Status produk "Secure Life Plus" diubah menjadi/i)).toBeDefined();
    });
  });

  it('should open create modal, validate, and successfully create a new product', async () => {
    const products = await productService.getProducts();
    const metrics = await productService.getProductMetrics();

    render(
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    );

    // Open modal
    const addBtn = screen.getByRole('button', { name: /Tambah Produk Baru/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Tambah Produk Asuransi Baru')).toBeDefined();

    // Fill all form inputs
    const nameInput = screen.getByPlaceholderText(/misal: Secure Life Plus/i);
    fireEvent.change(nameInput, { target: { value: 'Term Life Flex' } });

    const slugInput = screen.getByPlaceholderText(/misal: secure-life-plus/i);
    fireEvent.change(slugInput, { target: { value: 'term-life-flex' } });

    const catSelect = screen.getByDisplayValue('Asuransi Jiwa (Life)');
    fireEvent.change(catSelect, { target: { value: 'health' } });

    const statusSelect = screen.getByDisplayValue('Draft (Konfigurasi Internal)');
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    const minSumInput = screen.getByDisplayValue('50000000');
    fireEvent.change(minSumInput, { target: { value: '60000000' } });

    const maxSumInput = screen.getByDisplayValue('500000000');
    fireEvent.change(maxSumInput, { target: { value: '600000000' } });

    const premiumInput = screen.getByDisplayValue('150000');
    fireEvent.change(premiumInput, { target: { value: '180000' } });

    const baseRateInput = screen.getByDisplayValue('0.0035');
    fireEvent.change(baseRateInput, { target: { value: '0.0045' } });

    const descInput = screen.getByPlaceholderText(/Ringkasan 1-2 kalimat/i);
    fireEvent.change(descInput, { target: { value: 'Proteksi flexibel untuk kesehatan' } });

    const targetInput = screen.getByPlaceholderText(/misal: Keluarga muda dan pekerja/i);
    fireEvent.change(targetInput, { target: { value: 'Generasi muda 20-35 tahun' } });

    const textareas = screen.getAllByRole('textbox');
    // Benefits textarea
    fireEvent.change(textareas[textareas.length - 2], {
      target: { value: 'Santunan rawat inap\nOperasi darurat' },
    });
    // Exclusions textarea
    fireEvent.change(textareas[textareas.length - 1], {
      target: { value: 'Klaim palsu\nKelalaian disengaja' },
    });

    const submitBtn = screen.getByRole('button', { name: /Tambah Produk ✨/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Produk baru "Term Life Flex" berhasil ditambahkan./i)).toBeDefined();
    });

    // Dismiss toast
    const dismissBtn = screen.getByLabelText('Dismiss toast');
    fireEvent.click(dismissBtn);
    expect(screen.queryByLabelText('Dismiss toast')).toBeNull();
  });

  it('should show form error on conflict or invalid inputs in create modal', async () => {
    const products = await productService.getProducts();
    const metrics = await productService.getProductMetrics();

    render(
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    );

    // Open create modal
    const addBtn = screen.getByRole('button', { name: /Tambah Produk Baru/i });
    fireEvent.click(addBtn);

    // Enter existing slug to trigger duplicate error
    const nameInput = screen.getByPlaceholderText(/misal: Secure Life Plus/i);
    fireEvent.change(nameInput, { target: { value: 'Duplicate Secure Life' } });

    const slugInput = screen.getByPlaceholderText(/misal: secure-life-plus/i);
    fireEvent.change(slugInput, { target: { value: 'secure-life-plus' } });

    const submitBtn = screen.getByRole('button', { name: /Tambah Produk ✨/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/sudah terdaftar/i)).toBeDefined();
    });

    // Cancel modal
    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText('Tambah Produk Asuransi Baru')).toBeNull();
  });

  it('should open edit modal and successfully update product configuration', async () => {
    const products = await productService.getProducts();
    const metrics = await productService.getProductMetrics();

    render(
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    );

    const editBtns = screen.getAllByRole('button', { name: /Edit Konfigurasi/i });
    fireEvent.click(editBtns[0]); // First product: Secure Life Plus

    expect(screen.getByText(/Edit Konfigurasi: Secure Life Plus/i)).toBeDefined();

    const saveBtn = screen.getByRole('button', { name: /Simpan Perubahan 💾/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/berhasil diperbarui/i)).toBeDefined();
    });
  });

  it('should open and close the pricing rules and actuarial matrix modal', async () => {
    const products = await productService.getProducts();
    const metrics = await productService.getProductMetrics();

    render(
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    );

    const pricingBtns = screen.getAllByRole('button', { name: /Aturan Pricing & Aktuaria/i });
    fireEvent.click(pricingBtns[0]);

    expect(screen.getByText(/Matriks Pengali Usia \(Age Factors\)/i)).toBeDefined();
    expect(screen.getByText(/Pengali Risiko Gaya Hidup & Okupasi/i)).toBeDefined();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Tutup Detail/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Matriks Pengali Usia \(Age Factors\)/i)).toBeNull();
    });
  });
});
