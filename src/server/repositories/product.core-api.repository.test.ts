import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoreApiProductRepository } from './product.core-api.repository';
import { CreateProductDTO, UpdateProductDTO } from './product.repository.interface';

describe('CoreApiProductRepository', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockCoreProduct = {
    id: 'prod-001',
    name: 'Asuransi Jiwa Proteksi Ekstra',
    slug: 'asuransi-jiwa-proteksi-ekstra',
    category: 'life',
    status: 'active',
    short_description: 'Perlindungan jiwa finansial lengkap',
    description: 'Deskripsi lengkap asuransi jiwa.',
    target_customer: 'Keluarga Muda',
    min_sum_assured: 100_000_000,
    max_sum_assured: 2_000_000_000,
    min_payment_term: 5,
    max_payment_term: 20,
    starting_premium: 250_000,
    benefits: ['Santunan meninggal', 'Cacat total'],
    exclusions: ['Bunuh diri', 'Tindakan kriminal'],
    is_featured: true,
    active_policies_count: 150,
    gross_written_premium: 450_000_000,
    loss_ratio: 0.15,
    pricing_rules: {
      base_rate: 0.004,
      age_factors: [{ min_age: 18, max_age: 35, factor: 1.1 }],
      gender_factors: { male: 1.05, female: 1.0 },
      smoker_factors: { yes: 1.4, no: 1.0 },
      occupation_factors: { low: 0.9, standard: 1.0, high: 1.5 },
      health_factors: { low: 1.0, medium: 1.3, high: 1.8 },
      frequency_loading: { annual: 1.0, semi_annual: 1.02, quarterly: 1.04, monthly: 1.06 },
      annual_discount_pct: 12,
      non_mcu_limit: 600_000_000,
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  };

  it('fetches products list with category and status filter', async () => {
    let requestedUrl = '';
    global.fetch = vi.fn().mockImplementation((url: string) => {
      requestedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [mockCoreProduct] }),
      });
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const products = await repo.getProducts('life', 'active');

    expect(requestedUrl).toContain('/api/v1/products?category=life&status=active');
    expect(products.length).toBe(1);
    expect(products[0].id).toBe('prod-001');
    expect(products[0].name).toBe('Asuransi Jiwa Proteksi Ekstra');
    expect(products[0].shortDescription).toBe('Perlindungan jiwa finansial lengkap');
    expect(products[0].pricingRules.baseRate).toBe(0.004);
    expect(products[0].pricingRules.annualDiscountPct).toBe(12);
    expect(products[0].pricingRules.ageFactors[0].minAge).toBe(18);
    expect(products[0].pricingRules.frequencyLoading.semiAnnual).toBe(1.02);
  });

  it('fetches product by ID', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockCoreProduct }),
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const product = await repo.getProductById('prod-001');

    expect(product).not.toBeNull();
    expect(product?.id).toBe('prod-001');
    expect(product?.slug).toBe('asuransi-jiwa-proteksi-ekstra');
  });

  it('returns null when product is not found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: null }),
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const product = await repo.getProductById('non-existent');

    expect(product).toBeNull();
  });

  it('fetches product by Slug', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockCoreProduct }),
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const product = await repo.getProductBySlug('asuransi-jiwa-proteksi-ekstra');

    expect(product).not.toBeNull();
    expect(product?.slug).toBe('asuransi-jiwa-proteksi-ekstra');
  });

  it('creates product and maps snake_case payload', async () => {
    let requestBody: Record<string, unknown> = {};
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.body) {
        requestBody = JSON.parse(init.body.toString());
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: mockCoreProduct }),
      });
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const dto: CreateProductDTO = {
      name: 'Asuransi Jiwa Baru',
      slug: 'asuransi-jiwa-baru',
      category: 'life',
      shortDescription: 'Short desc',
      description: 'Long desc',
      targetCustomer: 'Semua Usia',
      minSumAssured: 50_000_000,
      maxSumAssured: 500_000_000,
      minPaymentTerm: 1,
      maxPaymentTerm: 10,
      startingPremium: 100_000,
      benefits: ['Benefit 1'],
      exclusions: ['Exclusion 1'],
      isFeatured: true,
      pricingRules: {
        baseRate: 0.0035,
        annualDiscountPct: 10,
        nonMcuLimit: 400_000_000,
        ageFactors: [{ minAge: 20, maxAge: 30, factor: 1.0 }],
        genderFactors: { male: 1.0, female: 1.0 },
        smokerFactors: { yes: 1.3, no: 1.0 },
        occupationFactors: { low: 0.9, standard: 1.0, high: 1.3 },
        healthFactors: { low: 1.0, medium: 1.2, high: 1.5 },
        frequencyLoading: { annual: 1.0, semiAnnual: 1.02, quarterly: 1.035, monthly: 1.06 },
      },
    };

    const created = await repo.createProduct(dto);
    expect(created.id).toBe('prod-001');
    expect(requestBody.name).toBe('Asuransi Jiwa Baru');
    expect(requestBody.short_description).toBe('Short desc');
    expect(requestBody.non_mcu_limit).toBe(400_000_000);
    const pricingRules = requestBody.pricing_rules as Record<string, unknown>;
    expect(pricingRules.base_rate).toBe(0.0035);
    expect(pricingRules.annual_discount_pct).toBe(10);
  });

  it('throws error when creating product with duplicate slug/name', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'product with slug already exists' }),
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const dto: CreateProductDTO = {
      name: 'Duplicate',
      slug: 'duplicate',
      category: 'life',
      shortDescription: 'desc',
      description: 'desc',
      targetCustomer: 'Umum',
      minSumAssured: 1000,
      maxSumAssured: 2000,
      minPaymentTerm: 1,
      maxPaymentTerm: 5,
      startingPremium: 100,
      benefits: [],
      exclusions: [],
    };

    await expect(repo.createProduct(dto)).rejects.toThrow('already exists');
  });

  it('updates product and handles pricing rules payload', async () => {
    let requestBody: Record<string, unknown> = {};
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.body) {
        requestBody = JSON.parse(init.body.toString());
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { ...mockCoreProduct, name: 'Updated Name' } }),
      });
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const dto: UpdateProductDTO = {
      name: 'Updated Name',
      pricingRules: {
        baseRate: 0.005,
        nonMcuLimit: 750_000_000,
      },
    };

    const updated = await repo.updateProduct('prod-001', dto);
    expect(updated.name).toBe('Updated Name');
    expect(requestBody.name).toBe('Updated Name');
    expect(requestBody.non_mcu_limit).toBe(750_000_000);
  });

  it('toggles product status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { ...mockCoreProduct, status: 'inactive' } }),
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const toggled = await repo.toggleProductStatus('prod-001');

    expect(toggled.status).toBe('inactive');
  });

  it('fetches product metrics from Core API and calculates format', async () => {
    const mockMetricsResponse = {
      data: {
        total_products: 8,
        active_products: 5,
        draft_products: 2,
        archived_products: 1,
        total_active_policies: 1200,
        total_gwp_volume: 8_500_000_000,
        total_gwp_volume_formatted: 'Rp 8.50 Miliar',
        average_loss_ratio: 0.18,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockMetricsResponse),
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const metrics = await repo.getProductMetrics();

    expect(metrics.totalProducts).toBe(8);
    expect(metrics.activeProducts).toBe(5);
    expect(metrics.draftProducts).toBe(2);
    expect(metrics.totalActivePolicies).toBe(1200);
    expect(metrics.totalGwpVolume).toBe(8_500_000_000);
    expect(metrics.totalGwpVolumeFormatted).toBe('Rp 8.50 Miliar');
    expect(metrics.averageLossRatio).toBe(0.18);
  });

  it('falls back to mock repository when Core API returns 500', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const products = await repo.getProducts();

    expect(products.length).toBeGreaterThan(0);
    const metrics = await repo.getProductMetrics();
    expect(metrics.totalProducts).toBeGreaterThan(0);
  });

  it('falls back to mock repository when network throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const repo = new CoreApiProductRepository('http://localhost:8080');
    const products = await repo.getProducts();

    expect(products.length).toBeGreaterThan(0);
  });

  it('falls back to mock repository when baseUrl is empty', async () => {
    const repo = new CoreApiProductRepository('');
    const products = await repo.getProducts();

    expect(products.length).toBeGreaterThan(0);
  });
});
