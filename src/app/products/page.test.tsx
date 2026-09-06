import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductsPage from './page';
import { ProductManagementWorkbench } from './ProductManagementWorkbench';
import { EditProductModal } from '@/components/organisms/EditProductModal';
import { productService } from '@/server/di';
import type { InsuranceProduct } from '@/server/repositories/product.repository.interface';

describe('ProductsPage & ProductManagementWorkbench', () => {
  it('should render the Server Component ProductsPage correctly', async () => {
    const Component = await ProductsPage();
    render(Component);

    expect(
      screen.getByRole('heading', { level: 1, name: /Manajemen Produk/i })
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

  it('should open create modal, fill form, and successfully create product with vector sync', async () => {
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

    expect(screen.getByText(/Definisi Produk & Parameter Underwriting/i)).toBeDefined();
    expect(screen.getByText(/OTOMATISASI VECTOR DB \(PGVECTOR & RAG AI\)/i)).toBeDefined();

    // Change product name
    const nameInput = screen.getByPlaceholderText(/misal: Perlindungan Jiwa Syariah Murni/i);
    fireEvent.change(nameInput, { target: { value: 'Term Life Flex Syariah' } });

    const slugInput = screen.getByPlaceholderText(/misal: life-syariah-murni/i);
    fireEvent.change(slugInput, { target: { value: 'term-life-flex-syariah' } });

    const submitBtn = screen.getByRole('button', { name: /Simpan & Sinkronkan ke Vector DB/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Produk baru "Term Life Flex Syariah" berhasil ditambahkan./i)).toBeDefined();
    });

    // Dismiss toast
    const dismissBtn = screen.getByLabelText('Dismiss toast');
    fireEvent.click(dismissBtn);
    expect(screen.queryByLabelText('Dismiss toast')).toBeNull();
  });

  it('should show form error on duplicate slug in create modal', async () => {
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

    // Set slug to existing product
    const slugInput = screen.getByPlaceholderText(/misal: life-syariah-murni/i);
    fireEvent.change(slugInput, { target: { value: 'secure-life-plus' } });

    const submitBtn = screen.getByRole('button', { name: /Simpan & Sinkronkan ke Vector DB/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/sudah terdaftar/i).length).toBeGreaterThan(0);
    });

    // Cancel modal
    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/Definisi Produk & Parameter Underwriting/i)).toBeNull();
  });

  it('should open edit modal and successfully update product with re-index', async () => {
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

    expect(screen.getByText(/Edit Produk: Secure Life Plus/i)).toBeDefined();
    expect(screen.getByText(/STATUS VECTOR DB: TERINDEKS AKTIF/i)).toBeDefined();

    const saveBtn = screen.getByRole('button', { name: /Perbarui & Re-Index Vector DB/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/berhasil diperbarui/i)).toBeDefined();
    });
  });

  it('should open and close the pricing rules modal and allow saving', async () => {
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

    expect(screen.getByText(/Konfigurasi Pricing Rules: Secure Life Plus/i)).toBeDefined();
    expect(screen.getByText(/TABEL KOEFISIEN MULTIPLIER USIA MASUK/i)).toBeDefined();
    expect(screen.getByText(/SINKRONISASI AKTIF: CORE API & VECTOR DB PGVECTOR/i)).toBeDefined();

    const saveBtn = screen.getByRole('button', { name: /Simpan Aturan Tarif/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Aturan pricing untuk "Secure Life Plus" berhasil diperbarui./i)).toBeDefined();
    });
  });

  it('should open sandbox calculation modal and allow testing formulas', async () => {
    const products = await productService.getProducts();
    const metrics = await productService.getProductMetrics();

    render(
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    );

    const sandboxBtns = screen.getAllByRole('button', { name: /Uji di Sandbox/i });
    fireEvent.click(sandboxBtns[0]);

    expect(screen.getByText(/Sandbox Simulator Kalkulasi Premi Aktuarial/i)).toBeDefined();
    expect(screen.getByText(/POST \/api\/v1\/simulations\/calculate/i)).toBeDefined();

    // Toggle smoker button
    const smokerBtn = screen.getByRole('button', { name: /Perokok \(\+35%/i });
    fireEvent.click(smokerBtn);

    // Close sandbox modal
    const closeBtn = screen.getByRole('button', { name: /Tutup Simulator/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Sandbox Simulator Kalkulasi Premi Aktuarial/i)).toBeNull();
    });
  });

  it('should render EditProductModal gracefully when product.pricingRules is undefined', () => {
    const productWithoutPricing = {
      id: 'prod-no-pricing',
      name: 'Accident Guard Basic',
      slug: 'accident-guard-basic',
      category: 'health' as const,
      status: 'active' as const,
      shortDescription: 'Asuransi kecelakaan tanpa pricing rules terdefinisi',
      description: 'Deskripsi lengkap',
      targetCustomer: 'Semua individu',
      minSumAssured: 50000000,
      maxSumAssured: 500000000,
      minPaymentTerm: 1,
      maxPaymentTerm: 10,
      startingPremium: 100000,
      benefits: ['Santunan kecelakaan'],
      exclusions: ['Tindakan kriminal'],
      isFeatured: false,
      activePoliciesCount: 0,
      grossWrittenPremium: 0,
      lossRatio: 0,
      averageTicketSize: 0,
      underwritingRulesCount: 0,
    } as unknown as InsuranceProduct;

    render(
      <EditProductModal
        isOpen={true}
        product={productWithoutPricing}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Edit Produk: Accident Guard Basic/i)).toBeDefined();
    const minAgeInput = screen.getByLabelText(/Usia Masuk Min/i) as HTMLInputElement;
    const maxAgeInput = screen.getByLabelText(/Usia Masuk Maks/i) as HTMLInputElement;
    expect(minAgeInput.value).toBe('18');
    expect(maxAgeInput.value).toBe('60');
  });

  it('should handle API failure gracefully when updating product fails with network error', async () => {
    const products = await productService.getProducts();
    const metrics = await productService.getProductMetrics();

    const spy = vi
      .spyOn(productService, 'updateProduct')
      .mockRejectedValueOnce(new Error('Network connection timeout'));

    render(
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    );

    const editBtns = screen.getAllByRole('button', { name: /Edit Konfigurasi/i });
    fireEvent.click(editBtns[0]);

    const saveBtn = screen.getByRole('button', { name: /Perbarui & Re-Index Vector DB/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Network connection timeout/i).length).toBeGreaterThan(0);
    });

    spy.mockRestore();
  });
});
