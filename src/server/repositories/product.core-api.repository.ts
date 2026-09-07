import {
  IProductRepository,
  InsuranceProduct,
  ProductCategory,
  ProductStatus,
  ProductMetrics,
  CreateProductDTO,
  UpdateProductDTO,
  PricingRules,
  AgeFactor,
} from './product.repository.interface';
import { ProductMockRepository } from './product.mock.repository';

interface CoreApiAgeFactor {
  min_age?: number;
  max_age?: number;
  minAge?: number;
  maxAge?: number;
  factor: number;
}

interface CoreApiPricingRules {
  base_rate?: number;
  baseRate?: number;
  age_factors?: CoreApiAgeFactor[];
  ageFactors?: CoreApiAgeFactor[];
  gender_factors?: { male?: number; female?: number };
  genderFactors?: { male?: number; female?: number };
  smoker_factors?: { yes?: number; no?: number };
  smokerFactors?: { yes?: number; no?: number };
  occupation_factors?: { low?: number; standard?: number; high?: number };
  occupationFactors?: { low?: number; standard?: number; high?: number };
  health_factors?: { low?: number; medium?: number; high?: number };
  healthFactors?: { low?: number; medium?: number; high?: number };
  frequency_loading?: {
    annual?: number;
    semi_annual?: number;
    semiAnnual?: number;
    quarterly?: number;
    monthly?: number;
  };
  frequencyLoading?: {
    annual?: number;
    semi_annual?: number;
    semiAnnual?: number;
    quarterly?: number;
    monthly?: number;
  };
  annual_discount_pct?: number;
  annualDiscountPct?: number;
  non_mcu_limit?: number;
  nonMcuLimit?: number;
}

interface CoreApiProductItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  short_description?: string;
  description?: string;
  target_customer?: string;
  min_sum_assured?: number;
  max_sum_assured?: number;
  min_payment_term?: number;
  max_payment_term?: number;
  starting_premium?: number;
  non_mcu_limit?: number;
  pricing_rules?: CoreApiPricingRules;
  benefits?: string[];
  exclusions?: string[];
  is_featured?: boolean;
  active_policies_count?: number;
  gross_written_premium?: number;
  loss_ratio?: number;
  created_at?: string;
  updated_at?: string;
}

interface CoreApiProductResponse {
  data: CoreApiProductItem;
}

interface CoreApiProductsListResponse {
  data: CoreApiProductItem[];
}

interface CoreApiProductMetricsResponse {
  data: {
    total_products?: number;
    active_products?: number;
    draft_products?: number;
    archived_products?: number;
    total_active_policies?: number;
    total_gwp_volume?: number;
    total_gwp_volume_formatted?: string;
    average_loss_ratio?: number;
  };
}

const DEFAULT_PRICING_RULES: PricingRules = {
  baseRate: 0.0035,
  ageFactors: [
    { minAge: 18, maxAge: 30, factor: 1.0 },
    { minAge: 31, maxAge: 40, factor: 1.25 },
    { minAge: 41, maxAge: 50, factor: 1.75 },
    { minAge: 51, maxAge: 60, factor: 2.5 },
  ],
  genderFactors: { male: 1.05, female: 1.0 },
  smokerFactors: { yes: 1.35, no: 1.0 },
  occupationFactors: { low: 0.95, standard: 1.0, high: 1.4 },
  healthFactors: { low: 1.0, medium: 1.25, high: 1.75 },
  frequencyLoading: { annual: 1.0, semiAnnual: 1.02, quarterly: 1.035, monthly: 1.06 },
  annualDiscountPct: 10,
  nonMcuLimit: 500_000_000,
};

export class CoreApiProductRepository implements IProductRepository {
  private readonly baseUrl: string;
  private readonly mockFallback: ProductMockRepository;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl !== undefined ? baseUrl : this.resolveBaseUrl();
    this.mockFallback = new ProductMockRepository();
  }

  private resolveBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return (
        process.env.NEXT_PUBLIC_CORE_API_URL?.trim() ||
        process.env.CORE_API_URL?.trim() ||
        ''
      );
    }
    return (
      process.env.CORE_API_INTERNAL_URL?.trim() ||
      process.env.CORE_API_URL?.trim() ||
      process.env.NEXT_PUBLIC_CORE_API_URL?.trim() ||
      ''
    );
  }

  private mapPricingRules(rules?: CoreApiPricingRules): PricingRules {
    if (!rules) return { ...DEFAULT_PRICING_RULES };

    const ageFactors: AgeFactor[] = (rules.age_factors || rules.ageFactors || []).map((af) => ({
      minAge: af.min_age ?? af.minAge ?? 18,
      maxAge: af.max_age ?? af.maxAge ?? 60,
      factor: af.factor,
    }));

    const gender = rules.gender_factors || rules.genderFactors || { male: 1.05, female: 1.0 };
    const smoker = rules.smoker_factors || rules.smokerFactors || { yes: 1.35, no: 1.0 };
    const occupation = rules.occupation_factors || rules.occupationFactors || {
      low: 0.95,
      standard: 1.0,
      high: 1.4,
    };
    const health = rules.health_factors || rules.healthFactors || {
      low: 1.0,
      medium: 1.25,
      high: 1.75,
    };
    const freq = rules.frequency_loading || rules.frequencyLoading || {
      annual: 1.0,
      semiAnnual: 1.02,
      quarterly: 1.035,
      monthly: 1.06,
    };

    return {
      baseRate: rules.base_rate ?? rules.baseRate ?? DEFAULT_PRICING_RULES.baseRate,
      ageFactors: ageFactors.length > 0 ? ageFactors : DEFAULT_PRICING_RULES.ageFactors,
      genderFactors: {
        male: gender.male ?? 1.05,
        female: gender.female ?? 1.0,
      },
      smokerFactors: {
        yes: smoker.yes ?? 1.35,
        no: smoker.no ?? 1.0,
      },
      occupationFactors: {
        low: occupation.low ?? 0.95,
        standard: occupation.standard ?? 1.0,
        high: occupation.high ?? 1.4,
      },
      healthFactors: {
        low: health.low ?? 1.0,
        medium: health.medium ?? 1.25,
        high: health.high ?? 1.75,
      },
      frequencyLoading: {
        annual: freq.annual ?? 1.0,
        semiAnnual: freq.semi_annual ?? freq.semiAnnual ?? 1.02,
        quarterly: freq.quarterly ?? 1.035,
        monthly: freq.monthly ?? 1.06,
      },
      annualDiscountPct:
        rules.annual_discount_pct ?? rules.annualDiscountPct ?? DEFAULT_PRICING_RULES.annualDiscountPct,
      nonMcuLimit:
        rules.non_mcu_limit ?? rules.nonMcuLimit ?? DEFAULT_PRICING_RULES.nonMcuLimit,
    };
  }

  private mapCoreProduct(item: CoreApiProductItem): InsuranceProduct {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      category: (item.category as ProductCategory) || 'life',
      status: (item.status as ProductStatus) || 'draft',
      shortDescription: item.short_description || '',
      description: item.description || item.short_description || '',
      targetCustomer: item.target_customer || 'Nasabah Terverifikasi Core & Mobile App',
      minSumAssured: item.min_sum_assured ?? 50_000_000,
      maxSumAssured: item.max_sum_assured ?? 1_000_000_000,
      minPaymentTerm: item.min_payment_term ?? 1,
      maxPaymentTerm: item.max_payment_term ?? 20,
      startingPremium: item.starting_premium ?? 100_000,
      pricingRules: this.mapPricingRules(item.pricing_rules),
      benefits: item.benefits || [],
      exclusions: item.exclusions || [],
      isFeatured: item.is_featured ?? false,
      activePoliciesCount: item.active_policies_count ?? 0,
      grossWrittenPremium: item.gross_written_premium ?? 0,
      lossRatio: item.loss_ratio ?? 0,
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString(),
    };
  }

  private mapRulesToCoreApi(rules?: Partial<PricingRules>): CoreApiPricingRules | undefined {
    if (!rules) return undefined;
    return {
      base_rate: rules.baseRate,
      age_factors: rules.ageFactors?.map((af) => ({
        min_age: af.minAge,
        max_age: af.maxAge,
        factor: af.factor,
      })),
      gender_factors: rules.genderFactors,
      smoker_factors: rules.smokerFactors,
      occupation_factors: rules.occupationFactors,
      health_factors: rules.healthFactors,
      frequency_loading: rules.frequencyLoading
        ? {
            annual: rules.frequencyLoading.annual,
            semi_annual: rules.frequencyLoading.semiAnnual,
            quarterly: rules.frequencyLoading.quarterly,
            monthly: rules.frequencyLoading.monthly,
          }
        : undefined,
      annual_discount_pct: rules.annualDiscountPct,
      non_mcu_limit: rules.nonMcuLimit,
    };
  }

  async getProducts(
    category?: ProductCategory | 'all',
    status?: ProductStatus | 'all'
  ): Promise<InsuranceProduct[]> {
    if (!this.baseUrl) {
      return this.mockFallback.getProducts(category, status);
    }

    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.set('category', category);
      }
      params.set('status', status || 'all');

      const url = `${this.baseUrl}/api/v1/products?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        return this.mockFallback.getProducts(category, status);
      }

      const json = (await response.json()) as CoreApiProductsListResponse;
      if (!json.data || !Array.isArray(json.data)) {
        return this.mockFallback.getProducts(category, status);
      }

      return json.data.map((item) => this.mapCoreProduct(item));
    } catch {
      return this.mockFallback.getProducts(category, status);
    }
  }

  async getProductById(id: string): Promise<InsuranceProduct | null> {
    if (!this.baseUrl) {
      return this.mockFallback.getProductById(id);
    }

    try {
      const url = `${this.baseUrl}/api/v1/products/id/${encodeURIComponent(id)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        return this.mockFallback.getProductById(id);
      }

      const json = (await response.json()) as CoreApiProductResponse;
      if (!json.data) {
        return null;
      }

      return this.mapCoreProduct(json.data);
    } catch {
      return this.mockFallback.getProductById(id);
    }
  }

  async getProductBySlug(slug: string): Promise<InsuranceProduct | null> {
    if (!this.baseUrl) {
      return this.mockFallback.getProductBySlug(slug);
    }

    try {
      const url = `${this.baseUrl}/api/v1/products/${encodeURIComponent(slug)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        return this.mockFallback.getProductBySlug(slug);
      }

      const json = (await response.json()) as CoreApiProductResponse;
      if (!json.data) {
        return null;
      }

      return this.mapCoreProduct(json.data);
    } catch {
      return this.mockFallback.getProductBySlug(slug);
    }
  }

  async createProduct(dto: CreateProductDTO): Promise<InsuranceProduct> {
    if (!this.baseUrl) {
      return this.mockFallback.createProduct(dto);
    }

    try {
      const payload = {
        name: dto.name,
        slug: dto.slug,
        category: dto.category,
        status: dto.status || 'draft',
        short_description: dto.shortDescription,
        description: dto.description || dto.shortDescription,
        target_customer: dto.targetCustomer,
        min_sum_assured: dto.minSumAssured,
        max_sum_assured: dto.maxSumAssured,
        min_payment_term: dto.minPaymentTerm,
        max_payment_term: dto.maxPaymentTerm,
        starting_premium: dto.startingPremium,
        non_mcu_limit: dto.pricingRules?.nonMcuLimit ?? 500_000_000,
        benefits: dto.benefits,
        exclusions: dto.exclusions,
        is_featured: dto.isFeatured ?? false,
        pricing_rules: this.mapRulesToCoreApi(dto.pricingRules),
      };

      const response = await fetch(`${this.baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const errorMessage = errorJson?.error || `Failed to create product (${response.status})`;
        throw new Error(errorMessage);
      }

      const json = (await response.json()) as CoreApiProductResponse;
      return this.mapCoreProduct(json.data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        throw err;
      }
      return this.mockFallback.createProduct(dto);
    }
  }

  async updateProduct(id: string, dto: UpdateProductDTO): Promise<InsuranceProduct> {
    if (!this.baseUrl) {
      return this.mockFallback.updateProduct(id, dto);
    }

    try {
      const payload: Record<string, unknown> = {};
      if (dto.name !== undefined) payload.name = dto.name;
      if (dto.slug !== undefined) payload.slug = dto.slug;
      if (dto.category !== undefined) payload.category = dto.category;
      if (dto.status !== undefined) payload.status = dto.status;
      if (dto.shortDescription !== undefined) payload.short_description = dto.shortDescription;
      if (dto.description !== undefined) payload.description = dto.description;
      if (dto.targetCustomer !== undefined) payload.target_customer = dto.targetCustomer;
      if (dto.minSumAssured !== undefined) payload.min_sum_assured = dto.minSumAssured;
      if (dto.maxSumAssured !== undefined) payload.max_sum_assured = dto.maxSumAssured;
      if (dto.minPaymentTerm !== undefined) payload.min_payment_term = dto.minPaymentTerm;
      if (dto.maxPaymentTerm !== undefined) payload.max_payment_term = dto.maxPaymentTerm;
      if (dto.startingPremium !== undefined) payload.starting_premium = dto.startingPremium;
      if (dto.isFeatured !== undefined) payload.is_featured = dto.isFeatured;
      if (dto.benefits !== undefined) payload.benefits = dto.benefits;
      if (dto.exclusions !== undefined) payload.exclusions = dto.exclusions;
      if (dto.pricingRules !== undefined) {
        payload.pricing_rules = this.mapRulesToCoreApi(dto.pricingRules);
        if (dto.pricingRules.nonMcuLimit !== undefined) {
          payload.non_mcu_limit = dto.pricingRules.nonMcuLimit;
        }
      }

      const response = await fetch(`${this.baseUrl}/api/v1/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const errorMessage = errorJson?.error || `Failed to update product (${response.status})`;
        throw new Error(errorMessage);
      }

      const json = (await response.json()) as CoreApiProductResponse;
      return this.mapCoreProduct(json.data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        throw err;
      }
      return this.mockFallback.updateProduct(id, dto);
    }
  }

  async toggleProductStatus(id: string): Promise<InsuranceProduct> {
    if (!this.baseUrl) {
      return this.mockFallback.toggleProductStatus(id);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/products/${encodeURIComponent(id)}/toggle-status`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        return this.mockFallback.toggleProductStatus(id);
      }

      const json = (await response.json()) as CoreApiProductResponse;
      return this.mapCoreProduct(json.data);
    } catch {
      return this.mockFallback.toggleProductStatus(id);
    }
  }

  async getProductMetrics(): Promise<ProductMetrics> {
    if (!this.baseUrl) {
      return this.mockFallback.getProductMetrics();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/admin/products/metrics`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        return this.mockFallback.getProductMetrics();
      }

      const json = (await response.json()) as CoreApiProductMetricsResponse;
      const m = json.data;

      const totalProducts = m.total_products ?? 0;
      const activeProducts = m.active_products ?? 0;
      const draftProducts = m.draft_products ?? 0;
      const totalActivePolicies = m.total_active_policies ?? 0;
      const totalGwpVolume = m.total_gwp_volume ?? 0;
      const averageLossRatio = m.average_loss_ratio ?? 0;

      const billions = (totalGwpVolume / 1_000_000_000).toFixed(2);
      const formatted =
        m.total_gwp_volume_formatted || `Rp ${billions} Miliar`;

      return {
        totalProducts,
        activeProducts,
        draftProducts,
        totalActivePolicies,
        totalGwpVolume,
        totalGwpVolumeFormatted: formatted,
        averageLossRatio,
      };
    } catch {
      return this.mockFallback.getProductMetrics();
    }
  }
}
