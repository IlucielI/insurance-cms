export type ProductCategory = 'life' | 'health' | 'vehicle';

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface AgeFactor {
  minAge: number;
  maxAge: number;
  factor: number;
}

export interface PricingRules {
  baseRate: number;
  ageFactors: AgeFactor[];
  genderFactors: {
    male: number;
    female: number;
  };
  smokerFactors: {
    yes: number;
    no: number;
  };
  occupationFactors: {
    low: number;
    standard: number;
    high: number;
  };
  healthFactors: {
    low: number;
    medium: number;
    high: number;
  };
  frequencyLoading: {
    annual: number;
    semiAnnual: number;
    quarterly: number;
    monthly: number;
  };
}

export interface InsuranceProduct {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  status: ProductStatus;
  shortDescription: string;
  description: string;
  targetCustomer: string;
  minSumAssured: number;
  maxSumAssured: number;
  minPaymentTerm: number;
  maxPaymentTerm: number;
  startingPremium: number;
  pricingRules: PricingRules;
  benefits: string[];
  exclusions: string[];
  isFeatured: boolean;
  // Actuarial & Portfolio Metrics
  activePoliciesCount: number;
  grossWrittenPremium: number;
  lossRatio: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMetrics {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  totalActivePolicies: number;
  totalGwpVolume: number;
  totalGwpVolumeFormatted: string;
  averageLossRatio: number;
}

export interface CreateProductDTO {
  name: string;
  slug: string;
  category: ProductCategory;
  status?: ProductStatus;
  shortDescription: string;
  description: string;
  targetCustomer: string;
  minSumAssured: number;
  maxSumAssured: number;
  minPaymentTerm: number;
  maxPaymentTerm: number;
  startingPremium: number;
  benefits: string[];
  exclusions: string[];
  isFeatured?: boolean;
  pricingRules?: Partial<PricingRules>;
}

export interface UpdateProductDTO {
  name?: string;
  slug?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  shortDescription?: string;
  description?: string;
  targetCustomer?: string;
  minSumAssured?: number;
  maxSumAssured?: number;
  minPaymentTerm?: number;
  maxPaymentTerm?: number;
  startingPremium?: number;
  benefits?: string[];
  exclusions?: string[];
  isFeatured?: boolean;
  pricingRules?: Partial<PricingRules>;
}

export interface IProductRepository {
  getProducts(category?: ProductCategory, status?: ProductStatus): Promise<InsuranceProduct[]>;
  getProductById(id: string): Promise<InsuranceProduct | null>;
  getProductBySlug(slug: string): Promise<InsuranceProduct | null>;
  createProduct(dto: CreateProductDTO): Promise<InsuranceProduct>;
  updateProduct(id: string, dto: UpdateProductDTO): Promise<InsuranceProduct>;
  toggleProductStatus(id: string): Promise<InsuranceProduct>;
  getProductMetrics(): Promise<ProductMetrics>;
}
