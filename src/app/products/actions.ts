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
export async function createProductAction(dto: CreateProductDTO): Promise<InsuranceProduct> {
  const created = await productService.createProduct(dto);
  safeRevalidateProducts();
  return created;
}

// Server Action to update an existing insurance product
export async function updateProductAction(
  id: string,
  dto: UpdateProductDTO
): Promise<InsuranceProduct> {
  const updated = await productService.updateProduct(id, dto);
  safeRevalidateProducts();
  return updated;
}

// Server Action to toggle product status (draft <-> active)
export async function toggleProductStatusAction(id: string): Promise<InsuranceProduct> {
  const toggled = await productService.toggleProductStatus(id);
  safeRevalidateProducts();
  return toggled;
}

// Server Action to archive an insurance product
export async function archiveProductAction(id: string): Promise<InsuranceProduct> {
  const archived = await productService.updateProduct(id, { status: 'archived' });
  safeRevalidateProducts();
  return archived;
}

// Server Action to fetch the latest product metrics
export async function fetchProductMetricsAction(): Promise<ProductMetrics> {
  return productService.getProductMetrics();
}
