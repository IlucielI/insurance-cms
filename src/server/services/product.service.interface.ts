import {
  InsuranceProduct,
  ProductCategory,
  ProductStatus,
  ProductMetrics,
  CreateProductDTO,
  UpdateProductDTO,
} from '@/server/repositories/product.repository.interface';

export interface IProductService {
  getProducts(category?: ProductCategory, status?: ProductStatus): Promise<InsuranceProduct[]>;
  getProductById(id: string): Promise<InsuranceProduct | null>;
  getProductBySlug(slug: string): Promise<InsuranceProduct | null>;
  createProduct(dto: CreateProductDTO): Promise<InsuranceProduct>;
  updateProduct(id: string, dto: UpdateProductDTO): Promise<InsuranceProduct>;
  toggleProductStatus(id: string): Promise<InsuranceProduct>;
  getProductMetrics(): Promise<ProductMetrics>;
}
