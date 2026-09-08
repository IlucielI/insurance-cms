import { describe, it, expect, vi } from 'vitest';
import {
  createProductAction,
  updateProductAction,
  toggleProductStatusAction,
  archiveProductAction,
  fetchProductMetricsAction,
} from './actions';
import { revalidatePath } from 'next/cache';

// Mock next/cache revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Product Server Actions', () => {
  it('creates a new product and revalidates /products', async () => {
    const uniqueSlug = `action-test-${Date.now()}`;
    const result = await createProductAction({
      name: 'Produk Action Test',
      slug: uniqueSlug,
      category: 'life',
      shortDescription: 'Deskripsi singkat',
      description: 'Deskripsi panjang',
      minSumAssured: 50_000_000,
      maxSumAssured: 500_000_000,
      minPaymentTerm: 1,
      maxPaymentTerm: 10,
      startingPremium: 100_000,
      benefits: ['Benefit 1'],
      exclusions: ['Exclusion 1'],
      targetCustomer: 'Umum',
    });

    expect(result).toBeDefined();
    expect('error' in result).toBe(false);
    if ('error' in result) throw new Error(result.error);
    expect(result.name).toBe('Produk Action Test');
    expect(result.slug).toBe(uniqueSlug);
    expect(revalidatePath).toHaveBeenCalledWith('/products');
  });

  it('updates an existing product and revalidates /products', async () => {
    const targetId = 'prod_secure_life_plus';
    const result = await updateProductAction(targetId, {
      name: 'Updated Product Name via Action',
      minSumAssured: 75_000_000,
    });

    expect(result).toBeDefined();
    expect('error' in result).toBe(false);
    if ('error' in result) throw new Error(result.error);
    expect(result.name).toBe('Updated Product Name via Action');
    expect(revalidatePath).toHaveBeenCalledWith('/products');
  });

  it('toggles product status and revalidates /products', async () => {
    const targetId = 'prod_secure_life_plus';
    const result = await toggleProductStatusAction(targetId);

    expect(result).toBeDefined();
    expect('error' in result).toBe(false);
    expect(revalidatePath).toHaveBeenCalledWith('/products');
  });

  it('archives a product and revalidates /products', async () => {
    const targetId = 'prod_secure_life_plus';
    const result = await archiveProductAction(targetId);

    expect(result).toBeDefined();
    expect('error' in result).toBe(false);
    if ('error' in result) throw new Error(result.error);
    expect(result.status).toBe('archived');
    expect(revalidatePath).toHaveBeenCalledWith('/products');
  });

  it('fetches latest product metrics', async () => {
    const metrics = await fetchProductMetricsAction();

    expect(metrics).toBeDefined();
    expect(metrics.totalProducts).toBeGreaterThan(0);
    expect(metrics.totalGwpVolumeFormatted).toBeDefined();
  });
});
