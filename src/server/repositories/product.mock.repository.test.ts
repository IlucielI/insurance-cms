import { describe, it, expect, beforeEach } from 'vitest';
import { ProductMockRepository } from './product.mock.repository';

describe('ProductMockRepository', () => {
  let repository: ProductMockRepository;

  beforeEach(() => {
    repository = new ProductMockRepository();
  });

  it('should fetch all initial products', async () => {
    const products = await repository.getProducts();
    expect(products.length).toBe(4);
    expect(products.map((p) => p.slug)).toContain('secure-life-plus');
    expect(products.map((p) => p.slug)).toContain('health-guard-essential');
    expect(products.map((p) => p.slug)).toContain('auto-shield-comprehensive');
  });

  it('should filter products by category and status', async () => {
    const lifeProducts = await repository.getProducts('life');
    expect(lifeProducts.length).toBe(1);
    expect(lifeProducts[0].name).toBe('Secure Life Plus');

    const draftProducts = await repository.getProducts(undefined, 'draft');
    expect(draftProducts.length).toBe(1);
    expect(draftProducts[0].slug).toBe('critical-care-shield');
  });

  it('should get product by id and slug', async () => {
    const product = await repository.getProductById('prod_secure_life_plus');
    expect(product).not.toBeNull();
    expect(product?.name).toBe('Secure Life Plus');

    const nonExisting = await repository.getProductById('prod_unknown');
    expect(nonExisting).toBeNull();

    const bySlug = await repository.getProductBySlug('health-guard-essential');
    expect(bySlug).not.toBeNull();
    expect(bySlug?.id).toBe('prod_health_guard_essential');

    const unknownSlug = await repository.getProductBySlug('unknown-slug');
    expect(unknownSlug).toBeNull();
  });

  it('should calculate portfolio metrics correctly', async () => {
    const metrics = await repository.getProductMetrics();
    expect(metrics.totalProducts).toBe(4);
    expect(metrics.activeProducts).toBe(3);
    expect(metrics.draftProducts).toBe(1);
    expect(metrics.totalActivePolicies).toBe(1142);
    expect(metrics.totalGwpVolumeFormatted).toBe('Rp 10.74 Miliar');
    expect(metrics.averageLossRatio).toBeGreaterThan(0);
  });

  it('should create a new product and reject duplicates', async () => {
    const created = await repository.createProduct({
      name: 'Smart Travel Guard',
      slug: 'smart-travel-guard',
      category: 'vehicle',
      shortDescription: 'Proteksi perjalanan internasional',
      description: 'Cover pembatalan tiket, medis darurat di luar negeri, dan bagasi hilang.',
      targetCustomer: 'Traveler dan pebisnis.',
      minSumAssured: 25_000_000,
      maxSumAssured: 250_000_000,
      minPaymentTerm: 1,
      maxPaymentTerm: 1,
      startingPremium: 50_000,
      benefits: ['Cover bagasi hilang', 'Bantuan medis luar negeri'],
      exclusions: ['Negara zona perang'],
    });

    expect(created.id).toBe('prod_smart_travel_guard');
    expect(created.status).toBe('draft');
    expect(created.benefits.length).toBe(2);

    // Conflict test
    await expect(
      repository.createProduct({
        name: 'Duplicate Travel Guard',
        slug: 'smart-travel-guard',
        category: 'vehicle',
        shortDescription: 'Desc',
        description: 'Desc',
        targetCustomer: 'Customer',
        minSumAssured: 10_000_000,
        maxSumAssured: 50_000_000,
        minPaymentTerm: 1,
        maxPaymentTerm: 1,
        startingPremium: 50_000,
        benefits: [],
        exclusions: [],
      })
    ).rejects.toThrow('sudah terdaftar');
  });

  it('should update an existing product and reject conflict slugs or invalid IDs', async () => {
    const updated = await repository.updateProduct('prod_secure_life_plus', {
      name: 'Secure Life Ultra',
      startingPremium: 200_000,
    });
    expect(updated.name).toBe('Secure Life Ultra');
    expect(updated.startingPremium).toBe(200_000);

    // Slug conflict with another product
    await expect(
      repository.updateProduct('prod_secure_life_plus', {
        slug: 'health-guard-essential',
      })
    ).rejects.toThrow('sudah digunakan');

    // Invalid ID
    await expect(
      repository.updateProduct('prod_invalid', {
        name: 'Test',
      })
    ).rejects.toThrow('tidak ditemukan');
  });

  it('should toggle product status between active and draft', async () => {
    // Current status is draft
    const toggled1 = await repository.toggleProductStatus('prod_critical_care_shield');
    expect(toggled1.status).toBe('active');

    // Toggle back to draft
    const toggled2 = await repository.toggleProductStatus('prod_critical_care_shield');
    expect(toggled2.status).toBe('draft');

    // Invalid product ID
    await expect(repository.toggleProductStatus('invalid_id')).rejects.toThrow('tidak ditemukan');
  });
});
