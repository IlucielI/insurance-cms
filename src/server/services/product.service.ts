import {
  IProductRepository,
  InsuranceProduct,
  ProductCategory,
  ProductStatus,
  ProductMetrics,
  CreateProductDTO,
  UpdateProductDTO,
} from '@/server/repositories/product.repository.interface';
import { IProductService } from './product.service.interface';

export class ProductService implements IProductService {
  constructor(private readonly repository: IProductRepository) {}

  async getProducts(category?: ProductCategory, status?: ProductStatus): Promise<InsuranceProduct[]> {
    return this.repository.getProducts(category, status);
  }

  async getProductById(id: string): Promise<InsuranceProduct | null> {
    if (!id || !id.trim()) {
      return null;
    }
    return this.repository.getProductById(id.trim());
  }

  async getProductBySlug(slug: string): Promise<InsuranceProduct | null> {
    if (!slug || !slug.trim()) {
      return null;
    }
    return this.repository.getProductBySlug(slug.trim());
  }

  async createProduct(dto: CreateProductDTO): Promise<InsuranceProduct> {
    const trimmedName = dto.name?.trim();
    if (!trimmedName) {
      throw new Error('Nama produk wajib diisi.');
    }

    const trimmedSlug = dto.slug?.trim().toLowerCase();
    if (!trimmedSlug) {
      throw new Error('Slug produk wajib diisi.');
    }

    if (dto.minSumAssured <= 0) {
      throw new Error('Batas minimum uang pertanggungan harus lebih dari Rp 0.');
    }

    if (dto.maxSumAssured < dto.minSumAssured) {
      throw new Error('Batas maksimum uang pertanggungan tidak boleh kurang dari batas minimum.');
    }

    if (dto.startingPremium <= 0) {
      throw new Error('Premi dasar harus lebih besar dari Rp 0.');
    }

    return this.repository.createProduct({
      ...dto,
      name: trimmedName,
      slug: trimmedSlug,
      shortDescription: dto.shortDescription?.trim() || 'Deskripsi ringkas produk proteksi asuransi.',
      description: dto.description?.trim() || 'Deskripsi detail ketentuan produk asuransi.',
      targetCustomer: dto.targetCustomer?.trim() || 'Individu dan keluarga.',
      benefits: dto.benefits ?? [],
      exclusions: dto.exclusions ?? [],
    });
  }

  async updateProduct(id: string, dto: UpdateProductDTO): Promise<InsuranceProduct> {
    if (!id || !id.trim()) {
      throw new Error('ID produk tidak valid.');
    }

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new Error('Nama produk tidak boleh kosong.');
    }

    if (dto.slug !== undefined && !dto.slug.trim()) {
      throw new Error('Slug produk tidak boleh kosong.');
    }

    if (dto.minSumAssured !== undefined && dto.minSumAssured <= 0) {
      throw new Error('Batas minimum uang pertanggungan harus lebih dari Rp 0.');
    }

    if (
      dto.minSumAssured !== undefined &&
      dto.maxSumAssured !== undefined &&
      dto.maxSumAssured < dto.minSumAssured
    ) {
      throw new Error('Batas maksimum uang pertanggungan tidak boleh kurang dari batas minimum.');
    }

    if (dto.startingPremium !== undefined && dto.startingPremium <= 0) {
      throw new Error('Premi dasar harus lebih besar dari Rp 0.');
    }

    const cleanedDto: UpdateProductDTO = { ...dto };
    if (dto.name !== undefined) cleanedDto.name = dto.name.trim();
    if (dto.slug !== undefined) cleanedDto.slug = dto.slug.trim().toLowerCase();

    return this.repository.updateProduct(id.trim(), cleanedDto);
  }

  async toggleProductStatus(id: string): Promise<InsuranceProduct> {
    if (!id || !id.trim()) {
      throw new Error('ID produk tidak valid.');
    }
    return this.repository.toggleProductStatus(id.trim());
  }

  async getProductMetrics(): Promise<ProductMetrics> {
    return this.repository.getProductMetrics();
  }
}
