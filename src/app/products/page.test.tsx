import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductsPage from './page';
import { ProductManagementWorkbench } from './ProductManagementWorkbench';
import { EditProductModal } from '@/components/organisms/EditProductModal';
import { PricingRulesModal } from '@/components/organisms/PricingRulesModal';
import { PremiumSandboxModal } from '@/components/organisms/PremiumSandboxModal';
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

  it('should forward updated minAge and maxAge in pricingRules payload when saving EditProductModal', async () => {
    const products = await productService.getProducts();
    const product = products[0];
    const onSubmitEdit = vi.fn().mockResolvedValue(undefined);

    render(
      <EditProductModal
        isOpen={true}
        product={product}
        onClose={vi.fn()}
        onSubmitEdit={onSubmitEdit}
      />
    );

    const minAgeInput = screen.getByLabelText(/Usia Masuk Min/i);
    const maxAgeInput = screen.getByLabelText(/Usia Masuk Maks/i);

    fireEvent.change(minAgeInput, { target: { value: '21' } });
    fireEvent.change(maxAgeInput, { target: { value: '55' } });

    const saveBtn = screen.getByRole('button', { name: /Perbarui & Re-Index Vector DB/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSubmitEdit).toHaveBeenCalledTimes(1);
    });

    const submittedProduct = onSubmitEdit.mock.calls[0][0];
    const ageFactors = submittedProduct.pricingRules.ageFactors;
    expect(ageFactors[0].minAge).toBe(21);
    expect(ageFactors[ageFactors.length - 1].maxAge).toBe(55);
  });

  it('should display error when minAge is greater than maxAge in EditProductModal', async () => {
    const products = await productService.getProducts();
    const product = products[0];
    const onSubmitEdit = vi.fn();

    render(
      <EditProductModal
        isOpen={true}
        product={product}
        onClose={vi.fn()}
        onSubmitEdit={onSubmitEdit}
      />
    );

    const minAgeInput = screen.getByLabelText(/Usia Masuk Min/i);
    const maxAgeInput = screen.getByLabelText(/Usia Masuk Maks/i);

    fireEvent.change(minAgeInput, { target: { value: '65' } });
    fireEvent.change(maxAgeInput, { target: { value: '50' } });

    const saveBtn = screen.getByRole('button', { name: /Perbarui & Re-Index Vector DB/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Batas usia masuk minimum tidak boleh lebih besar dari usia maksimum./i)).toBeDefined();
    });

    expect(onSubmitEdit).not.toHaveBeenCalled();
  });

  it('should initialize PricingRulesModal with custom annualDiscountPct and nonMcuLimit from product', async () => {
    const products = await productService.getProducts();
    const productWithCustomRules: InsuranceProduct = {
      ...products[0],
      pricingRules: {
        ...products[0].pricingRules,
        annualDiscountPct: 12.0,
        nonMcuLimit: 1500000000,
      },
    };
    const onSavePricingRules = vi.fn().mockResolvedValue(undefined);

    render(
      <PricingRulesModal
        isOpen={true}
        product={productWithCustomRules}
        onClose={vi.fn()}
        onSavePricingRules={onSavePricingRules}
      />
    );

    const discountInput = screen.getByLabelText(/Diskon Frekuensi Tahunan/i) as HTMLInputElement;
    const nonMcuInput = screen.getByLabelText(/Batas Maksimal Bebas Tes Medis/i) as HTMLInputElement;

    expect(discountInput.value).toBe('12');
    expect(nonMcuInput.value).toBe('1500000000');

    const saveBtn = screen.getByRole('button', { name: /Simpan Aturan Tarif/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSavePricingRules).toHaveBeenCalledTimes(1);
    });

    const savedRules = onSavePricingRules.mock.calls[0][0].pricingRules;
    expect(savedRules.annualDiscountPct).toBe(12.0);
    expect(savedRules.nonMcuLimit).toBe(1500000000);
  });

  it('should fallback to 8.0 and 1000000000 in PricingRulesModal when fields or pricingRules undefined', () => {
    const productWithoutCustomRules = {
      id: 'prod-fallback-pricing',
      name: 'Fallback Test Product',
      slug: 'fallback-test-product',
      category: 'life' as const,
      status: 'active' as const,
      shortDescription: 'Deskripsi',
      description: 'Deskripsi lengkap',
      targetCustomer: 'Semua',
      minSumAssured: 100000000,
      maxSumAssured: 1000000000,
      minPaymentTerm: 10,
      maxPaymentTerm: 20,
      startingPremium: 200000,
      benefits: ['Benefit'],
      exclusions: ['Exclusion'],
      isFeatured: false,
      activePoliciesCount: 0,
      grossWrittenPremium: 0,
      lossRatio: 0,
      averageTicketSize: 0,
      underwritingRulesCount: 0,
    } as unknown as InsuranceProduct;

    render(
      <PricingRulesModal
        isOpen={true}
        product={productWithoutCustomRules}
        onClose={vi.fn()}
      />
    );

    const discountInput = screen.getByLabelText(/Diskon Frekuensi Tahunan/i) as HTMLInputElement;
    const nonMcuInput = screen.getByLabelText(/Batas Maksimal Bebas Tes Medis/i) as HTMLInputElement;

    expect(discountInput.value).toBe('8');
    expect(nonMcuInput.value).toBe('1000000000');
  });

  it('should update multi-band ageFactors correctly without mutating internal band bounds in EditProductModal', async () => {
    const products = await productService.getProducts();
    const productWithMultiBands: InsuranceProduct = {
      ...products[0],
      pricingRules: {
        ...products[0].pricingRules,
        ageFactors: [
          { minAge: 18, maxAge: 30, factor: 1.0 },
          { minAge: 31, maxAge: 60, factor: 1.5 },
        ],
      },
    };
    const onSubmitEdit = vi.fn().mockResolvedValue(undefined);

    render(
      <EditProductModal
        isOpen={true}
        product={productWithMultiBands}
        onClose={vi.fn()}
        onSubmitEdit={onSubmitEdit}
      />
    );

    const minAgeInput = screen.getByLabelText(/Usia Masuk Min/i);
    const maxAgeInput = screen.getByLabelText(/Usia Masuk Maks/i);

    fireEvent.change(minAgeInput, { target: { value: '21' } });
    fireEvent.change(maxAgeInput, { target: { value: '55' } });

    const saveBtn = screen.getByRole('button', { name: /Perbarui & Re-Index Vector DB/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSubmitEdit).toHaveBeenCalledTimes(1);
    });

    const submittedProduct = onSubmitEdit.mock.calls[0][0];
    const factors = submittedProduct.pricingRules.ageFactors;
    expect(factors.length).toBe(2);
    expect(factors[0].minAge).toBe(21);
    expect(factors[0].maxAge).toBe(30);
    expect(factors[1].minAge).toBe(31);
    expect(factors[1].maxAge).toBe(55);
  });

  it('should trigger onOpenSandbox before calling onClose in PricingRulesModal', () => {
    const callOrder: string[] = [];
    const onOpenSandbox = vi.fn(() => {
      callOrder.push('openSandbox');
    });
    const onClose = vi.fn(() => {
      callOrder.push('close');
    });

    const mockProduct = {
      id: 'prod-test-sandbox',
      name: 'Sandbox Flow Product',
      slug: 'sandbox-flow',
      category: 'life' as const,
      status: 'active' as const,
      shortDescription: 'Deskripsi',
      description: 'Deskripsi lengkap',
      targetCustomer: 'Semua',
      minSumAssured: 100000000,
      maxSumAssured: 1000000000,
      minPaymentTerm: 10,
      maxPaymentTerm: 20,
      startingPremium: 200000,
      benefits: ['Benefit'],
      exclusions: ['Exclusion'],
      isFeatured: false,
      activePoliciesCount: 0,
      grossWrittenPremium: 0,
      lossRatio: 0,
      averageTicketSize: 0,
      underwritingRulesCount: 0,
      pricingRules: {
        baseRate: 0.0023,
        ageFactors: [{ minAge: 18, maxAge: 60, factor: 1.0 }],
        genderFactors: { male: 1.0, female: 1.0 },
        smokerFactors: { yes: 1.35, no: 1.0 },
        occupationFactors: { low: 1.0, standard: 1.0, high: 1.0 },
        healthFactors: { low: 1.0, medium: 1.0, high: 1.0 },
        frequencyLoading: { annual: 1.0, semiAnnual: 1.0, quarterly: 1.0, monthly: 1.0 },
      },
    } as unknown as InsuranceProduct;

    render(
      <PricingRulesModal
        isOpen={true}
        product={mockProduct}
        onClose={onClose}
        onOpenSandbox={onOpenSandbox}
      />
    );

    const testBtn = screen.getByRole('button', { name: /Uji di Sandbox/i });
    fireEvent.click(testBtn);

    expect(onOpenSandbox).toHaveBeenCalledWith('prod-test-sandbox');
    expect(onClose).toHaveBeenCalled();
    expect(callOrder).toEqual(['openSandbox', 'close']);
  });

  it('should render graceful empty state in PremiumSandboxModal when products list is empty', () => {
    const onClose = vi.fn();

    render(
      <PremiumSandboxModal
        isOpen={true}
        onClose={onClose}
        products={[]}
      />
    );

    expect(screen.getByText(/Tidak Ada Produk Tersedia/i)).toBeDefined();
    expect(screen.getByText(/Katalog Produk Kosong/i)).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /Tutup Simulator/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should allow editing all numbers in PricingRulesModal including brackets, gender, smoker, occupation, and frequency loadings', async () => {
    const products = await productService.getProducts();
    const targetProduct = products[0];
    const onSavePricingRules = vi.fn().mockResolvedValue(undefined);

    render(
      <PricingRulesModal
        isOpen={true}
        product={targetProduct}
        onClose={vi.fn()}
        onSavePricingRules={onSavePricingRules}
      />
    );

    // 1. Edit Base Rate & Tenor
    const baseRateInput = screen.getByLabelText(/Tarif Dasar per Rp 1.000 UP/i) as HTMLInputElement;
    fireEvent.change(baseRateInput, { target: { value: '4.50' } });
    expect(baseRateInput.value).toBe('4.50');

    const tenorInput = screen.getByLabelText(/Masa Tenor Minimum Polis/i) as HTMLInputElement;
    fireEvent.change(tenorInput, { target: { value: '15' } });
    expect(tenorInput.value).toBe('15');

    // 2. Edit Age Bracket 1 and Add Bracket
    const minAge1 = screen.getByLabelText(/Usia Minimum Bracket 1/i) as HTMLInputElement;
    fireEvent.change(minAge1, { target: { value: '20' } });
    const maxAge1 = screen.getByLabelText(/Usia Maksimum Bracket 1/i) as HTMLInputElement;
    fireEvent.change(maxAge1, { target: { value: '35' } });
    const factor1 = screen.getByLabelText(/Koefisien Faktor Bracket 1/i) as HTMLInputElement;
    fireEvent.change(factor1, { target: { value: '1.15' } });

    const addBracketBtn = screen.getByRole('button', { name: /\+ Tambah Rentang Usia/i });
    fireEvent.click(addBracketBtn);

    // 3. Edit Gender Multipliers
    const maleInput = screen.getByLabelText(/Faktor Jenis Kelamin Pria/i) as HTMLInputElement;
    fireEvent.change(maleInput, { target: { value: '1.08' } });
    const femaleInput = screen.getByLabelText(/Faktor Jenis Kelamin Wanita/i) as HTMLInputElement;
    fireEvent.change(femaleInput, { target: { value: '1.02' } });

    // 4. Edit Smoker Multipliers
    const smokerInput = screen.getByLabelText(/Faktor Perokok Aktif/i) as HTMLInputElement;
    fireEvent.change(smokerInput, { target: { value: '1.45' } });
    const nonSmokerInput = screen.getByLabelText(/Faktor Bebas Rokok/i) as HTMLInputElement;
    fireEvent.change(nonSmokerInput, { target: { value: '0.98' } });

    // 5. Edit Occupation Multipliers
    const occLowInput = screen.getByLabelText(/Faktor Risiko Pekerjaan Rendah/i) as HTMLInputElement;
    fireEvent.change(occLowInput, { target: { value: '0.90' } });
    const occStdInput = screen.getByLabelText(/Faktor Risiko Pekerjaan Standar/i) as HTMLInputElement;
    fireEvent.change(occStdInput, { target: { value: '1.05' } });
    const occHighInput = screen.getByLabelText(/Faktor Risiko Pekerjaan Tinggi/i) as HTMLInputElement;
    fireEvent.change(occHighInput, { target: { value: '1.50' } });

    // 6. Edit Frequency Loadings
    const freqAnnual = screen.getByLabelText(/Loading Cara Bayar Tahunan/i) as HTMLInputElement;
    fireEvent.change(freqAnnual, { target: { value: '0.95' } });
    const freqQuarterly = screen.getByLabelText(/Loading Cara Bayar Kuartalan/i) as HTMLInputElement;
    fireEvent.change(freqQuarterly, { target: { value: '1.04' } });
    const freqMonthly = screen.getByLabelText(/Loading Cara Bayar Bulanan/i) as HTMLInputElement;
    fireEvent.change(freqMonthly, { target: { value: '1.08' } });

    // Save
    const saveBtn = screen.getByRole('button', { name: /Simpan Aturan Tarif/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSavePricingRules).toHaveBeenCalledTimes(1);
    });

    const savedProduct = onSavePricingRules.mock.calls[0][0];
    expect(savedProduct.minPaymentTerm).toBe(15);
    expect(savedProduct.pricingRules.baseRate).toBe(0.0045);
    expect(savedProduct.pricingRules.genderFactors.male).toBe(1.08);
    expect(savedProduct.pricingRules.genderFactors.female).toBe(1.02);
    expect(savedProduct.pricingRules.smokerFactors.yes).toBe(1.45);
    expect(savedProduct.pricingRules.smokerFactors.no).toBe(0.98);
    expect(savedProduct.pricingRules.occupationFactors.low).toBe(0.90);
    expect(savedProduct.pricingRules.occupationFactors.standard).toBe(1.05);
    expect(savedProduct.pricingRules.occupationFactors.high).toBe(1.50);
    expect(savedProduct.pricingRules.frequencyLoading.annual).toBe(0.95);
    expect(savedProduct.pricingRules.frequencyLoading.quarterly).toBe(1.04);
    expect(savedProduct.pricingRules.frequencyLoading.monthly).toBe(1.08);

    // Brackets check: bracket 1 edited + 1 bracket appended
    expect(savedProduct.pricingRules.ageFactors[0].minAge).toBe(20);
    expect(savedProduct.pricingRules.ageFactors[0].maxAge).toBe(35);
    expect(savedProduct.pricingRules.ageFactors[0].factor).toBe(1.15);
    expect(savedProduct.pricingRules.ageFactors.length).toBeGreaterThanOrEqual(5);
  });

  it('should prevent saving and display error when invalid input or minAge >= maxAge is entered', async () => {
    const products = await productService.getProducts();
    const targetProduct = products[0];
    const onSavePricingRules = vi.fn();

    render(
      <PricingRulesModal
        isOpen={true}
        product={targetProduct}
        onClose={vi.fn()}
        onSavePricingRules={onSavePricingRules}
      />
    );

    // 1. Enter invalid base rate (0)
    const baseRateInput = screen.getByLabelText(/Tarif Dasar per Rp 1.000 UP/i) as HTMLInputElement;
    fireEvent.change(baseRateInput, { target: { value: '0' } });

    const saveBtn = screen.getByRole('button', { name: /Simpan Aturan Tarif/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText(/Tarif dasar harus bernilai angka positif/i)).toBeDefined();
    expect(onSavePricingRules).not.toHaveBeenCalled();

    // 2. Fix base rate, but set minAge >= maxAge in bracket 1
    fireEvent.change(baseRateInput, { target: { value: '3.50' } });
    const minAge1 = screen.getByLabelText(/Usia Minimum Bracket 1/i) as HTMLInputElement;
    fireEvent.change(minAge1, { target: { value: '45' } });
    const maxAge1 = screen.getByLabelText(/Usia Maksimum Bracket 1/i) as HTMLInputElement;
    fireEvent.change(maxAge1, { target: { value: '30' } });

    fireEvent.click(saveBtn);

    expect(screen.getByText(/usia minimum \(45\) harus lebih kecil dari usia maksimum \(30\)/i)).toBeDefined();
    expect(onSavePricingRules).not.toHaveBeenCalled();
  });

  it('should allow removing an age bracket when more than one exists', async () => {
    const products = await productService.getProducts();
    const targetProduct = products[0];

    render(
      <PricingRulesModal
        isOpen={true}
        product={targetProduct}
        onClose={vi.fn()}
      />
    );

    const deleteBtnsBefore = screen.getAllByLabelText(/Hapus Bracket/i);
    expect(deleteBtnsBefore.length).toBeGreaterThan(0);

    fireEvent.click(deleteBtnsBefore[0]);

    const deleteBtnsAfter = screen.getAllByLabelText(/Hapus Bracket/i);
    expect(deleteBtnsAfter.length).toBe(deleteBtnsBefore.length - 1);
  });
});
