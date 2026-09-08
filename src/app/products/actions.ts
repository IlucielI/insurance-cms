'use server';

import { revalidatePath } from 'next/cache';
import { productService } from '@/server/di';
import {
  CreateProductDTO,
  InsuranceProduct,
  ProductMetrics,
  UpdateProductDTO,
} from '@/server/repositories/product.repository.interface';

function safeRevalidateProducts() {
  try {
    revalidatePath('/products');
  } catch {
    // Ignore when called outside Next.js request context (e.g. in test environment)
  }
}

// Server Action to create a new insurance product
export async function createProductAction(
  dto: CreateProductDTO
): Promise<InsuranceProduct | { error: string }> {
  try {
    const created = await productService.createProduct(dto);
    safeRevalidateProducts();
    return created;
  } catch (err: unknown) {
    let errorMessage = err instanceof Error ? err.message : 'Gagal menambahkan produk baru.';
    if (errorMessage.includes('slug already exists') || errorMessage.includes('duplicate')) {
      errorMessage = `Produk dengan slug "${dto.slug}" sudah terdaftar di sistem. Silakan gunakan slug lain.`;
    }
    return { error: errorMessage };
  }
}

// Server Action to update an existing insurance product
export async function updateProductAction(
  id: string,
  dto: UpdateProductDTO
): Promise<InsuranceProduct | { error: string }> {
  try {
    const updated = await productService.updateProduct(id, dto);
    safeRevalidateProducts();
    return updated;
  } catch (err: unknown) {
    let errorMessage = err instanceof Error ? err.message : 'Gagal memperbarui produk.';
    if (errorMessage.includes('slug already exists') || errorMessage.includes('duplicate')) {
      errorMessage = `Produk dengan slug "${dto.slug}" sudah terdaftar di sistem. Silakan gunakan slug lain.`;
    }
    return { error: errorMessage };
  }
}

// Server Action to toggle product status (draft <-> active)
export async function toggleProductStatusAction(
  id: string
): Promise<InsuranceProduct | { error: string }> {
  try {
    const toggled = await productService.toggleProductStatus(id);
    safeRevalidateProducts();
    return toggled;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Gagal mengubah status produk.' };
  }
}

// Server Action to archive an insurance product
export async function archiveProductAction(
  id: string
): Promise<InsuranceProduct | { error: string }> {
  try {
    const archived = await productService.updateProduct(id, { status: 'archived' });
    safeRevalidateProducts();
    return archived;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Gagal mengarsipkan produk.' };
  }
}

// Server Action to fetch the latest product metrics
export async function fetchProductMetricsAction(): Promise<ProductMetrics> {
  return productService.getProductMetrics();
}
