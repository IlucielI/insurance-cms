import { describe, it, expect, beforeEach } from 'vitest';
import { ProductService } from './product.service';
import { ProductMockRepository } from '@/server/repositories/product.mock.repository';

describe('ProductService', () => {
  let service: ProductService;
  let repository: ProductMockRepository;

  beforeEach(() => {
    repository = new ProductMockRepository();
    service = new ProductService(repository);
  });

  it('should delegate getProducts and metrics to repository', async () => {
    const products = await service.getProducts();
    expect(products.length).toBe(4);

    const metrics = await service.getProductMetrics();
    expect(metrics.totalProducts).toBe(4);
  });

  it('should find product by id and slug with trimmed parameters', async () => {
    const p1 = await service.getProductById('  prod_secure_life_plus  ');
    expect(p1?.name).toBe('Secure Life Plus');

    const emptyId = await service.getProductById('   ');
    expect(emptyId).toBeNull();

    const p2 = await service.getProductBySlug('  health-guard-essential  ');
    expect(p2?.id).toBe('prod_health_guard_essential');

    const emptySlug = await service.getProductBySlug('');
    expect(emptySlug).toBeNull();
  });

  it('should validate inputs during createProduct', async () => {
    // Empty name
    await expect(
      service.createProduct({
        name: '   ',
        slug: 'valid-slug',
        category: 'life',
        shortDescription: 'Desc',
        description: 'Desc',
        targetCustomer: 'Target',
        minSumAssured: 10_000_000,
        maxSumAssured: 100_000_000,
        minPaymentTerm: 1,
        maxPaymentTerm: 5,
        startingPremium: 50_000,
        benefits: [],
        exclusions: [],
      })
    ).rejects.toThrow('Nama produk wajib diisi.');

    // Empty slug
    await expect(
      service.createProduct({
        name: 'Product Name',
        slug: '',
        category: 'life',
        shortDescription: 'Desc',
        description: 'Desc',
        targetCustomer: 'Target',
        minSumAssured: 10_000_000,
        maxSumAssured: 100_000_000,
        minPaymentTerm: 1,
        maxPaymentTerm: 5,
        startingPremium: 50_000,
        benefits: [],
        exclusions: [],
      })
    ).rejects.toThrow('Slug produk wajib diisi.');

    // Min sum assured <= 0
    await expect(
      service.createProduct({
        name: 'Product Name',
        slug: 'product-slug',
        category: 'life',
        shortDescription: 'Desc',
        description: 'Desc',
        targetCustomer: 'Target',
        minSumAssured: 0,
        maxSumAssured: 100_000_000,
        minPaymentTerm: 1,
        maxPaymentTerm: 5,
        startingPremium: 50_000,
        benefits: [],
        exclusions: [],
      })
    ).rejects.toThrow('Batas minimum uang pertanggungan harus lebih dari Rp 0.');

    // Max sum assured < min sum assured
    await expect(
      service.createProduct({
        name: 'Product Name',
        slug: 'product-slug',
        category: 'life',
        shortDescription: 'Desc',
        description: 'Desc',
        targetCustomer: 'Target',
        minSumAssured: 100_000_000,
        maxSumAssured: 50_000_000,
        minPaymentTerm: 1,
        maxPaymentTerm: 5,
        startingPremium: 50_000,
        benefits: [],
        exclusions: [],
      })
    ).rejects.toThrow('Batas maksimum uang pertanggungan tidak boleh kurang dari batas minimum.');

    // Starting premium <= 0
    await expect(
      service.createProduct({
        name: 'Product Name',
        slug: 'product-slug',
        category: 'life',
        shortDescription: 'Desc',
        description: 'Desc',
        targetCustomer: 'Target',
        minSumAssured: 10_000_000,
        maxSumAssured: 50_000_000,
        minPaymentTerm: 1,
        maxPaymentTerm: 5,
        startingPremium: 0,
        benefits: [],
        exclusions: [],
      })
    ).rejects.toThrow('Premi dasar harus lebih besar dari Rp 0.');

    // Valid create
    const created = await service.createProduct({
      name: 'Family Health Guard',
      slug: 'family-health-guard',
      category: 'health',
      shortDescription: 'Proteksi kesehatan keluarga',
      description: 'Cover menyeluruh rawat inap keluarga.',
      targetCustomer: 'Keluarga 4 anggota.',
      minSumAssured: 50_000_000,
      maxSumAssured: 200_000_000,
      minPaymentTerm: 1,
      maxPaymentTerm: 10,
      startingPremium: 150_000,
      benefits: ['Cover rawat inap'],
      exclusions: [],
    });
    expect(created.id).toBe('prod_family_health_guard');
    expect(created.name).toBe('Family Health Guard');
  });

  it('should validate inputs during updateProduct and toggleProductStatus', async () => {
    // Empty ID
    await expect(service.updateProduct('  ', { name: 'New' })).rejects.toThrow('ID produk tidak valid.');
    await expect(service.toggleProductStatus('  ')).rejects.toThrow('ID produk tidak valid.');

    // Empty name update
    await expect(service.updateProduct('prod_secure_life_plus', { name: '  ' })).rejects.toThrow(
      'Nama produk tidak boleh kosong.'
    );

    // Empty slug update
    await expect(service.updateProduct('prod_secure_life_plus', { slug: '  ' })).rejects.toThrow(
      'Slug produk tidak boleh kosong.'
    );

    // Invalid min/max bounds
    await expect(
      service.updateProduct('prod_secure_life_plus', { minSumAssured: 0 })
    ).rejects.toThrow('Batas minimum uang pertanggungan harus lebih dari Rp 0.');

    await expect(
      service.updateProduct('prod_secure_life_plus', {
        minSumAssured: 500_000_000,
        maxSumAssured: 100_000_000,
      })
    ).rejects.toThrow('Batas maksimum uang pertanggungan tidak boleh kurang dari batas minimum.');

    await expect(
      service.updateProduct('prod_secure_life_plus', { startingPremium: -500 })
    ).rejects.toThrow('Premi dasar harus lebih besar dari Rp 0.');

    // Valid update
    const updated = await service.updateProduct('prod_secure_life_plus', {
      name: 'Secure Life Plus Updated',
      startingPremium: 210_000,
    });
    expect(updated.name).toBe('Secure Life Plus Updated');

    // Valid toggle
    const toggled = await service.toggleProductStatus('prod_secure_life_plus');
    expect(toggled.status).toBe('draft');
  });
});
