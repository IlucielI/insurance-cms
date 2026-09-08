import React from 'react';
import { CMSLayout } from '@/components/templates/CMSLayout';
import { productService } from '@/server/di';
import { ProductManagementWorkbench } from './ProductManagementWorkbench';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, metrics] = await Promise.all([
    productService.getProducts(undefined, 'all'),
    productService.getProductMetrics(),
  ]);

  return (
    <CMSLayout pageTitle="Manajemen Produk & Aturan Underwriting" currentPath="/products">
      <ProductManagementWorkbench
        initialProducts={products}
        initialMetrics={metrics}
      />
    </CMSLayout>
  );
}
