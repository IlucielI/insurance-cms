import {
  IProductRepository,
  InsuranceProduct,
  ProductCategory,
  ProductStatus,
  ProductMetrics,
  CreateProductDTO,
  UpdateProductDTO,
  PricingRules,
} from './product.repository.interface';

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
};

export class ProductMockRepository implements IProductRepository {
  private products: InsuranceProduct[] = [
    {
      id: 'prod_secure_life_plus',
      name: 'Secure Life Plus',
      slug: 'secure-life-plus',
      category: 'life',
      status: 'active',
      shortDescription: 'Asuransi jiwa berjangka dengan perlindungan finansial keluarga optimal.',
      description:
        'Memberikan santunan perlindungan finansial menyeluruh bagi ahli waris jika tertanggung meninggal dunia atau mengalami kondisi sakit kritis terminal.',
      targetCustomer: 'Keluarga muda dan pencari nafkah utama (usia 21 - 55 tahun).',
      minSumAssured: 100_000_000,
      maxSumAssured: 1_000_000_000,
      minPaymentTerm: 5,
      maxPaymentTerm: 20,
      startingPremium: 185_000,
      pricingRules: {
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
      },
      benefits: [
        'Santunan meninggal dunia 100% Uang Pertanggungan',
        'Terminal illness benefit hingga 80% UP',
        'Opsi tambahan accidental death rider',
        'Bebas biaya administrasi polis elektronik',
      ],
      exclusions: [
        'Klaim palsu atau penipuan identitas',
        'Penyakit kritis yang telah ada sebelumnya (pre-existing condition)',
        'Tindakan melanggar hukum',
      ],
      isFeatured: true,
      activePoliciesCount: 524,
      grossWrittenPremium: 5_240_000_000,
      lossRatio: 14.2,
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-09-01T10:30:00Z',
    },
    {
      id: 'prod_health_guard_essential',
      name: 'Health Guard Essential',
      slug: 'health-guard-essential',
      category: 'health',
      status: 'active',
      shortDescription: 'Perlindungan komprehensif rawat inap rumah sakit & pembedahan darurat.',
      description:
        'Mengcover biaya perawatan rumah sakit, tindakan pembedahan darurat, dan fasilitas cashless di lebih dari 850 rumah sakit rekanan se-Indonesia.',
      targetCustomer: 'Individu mandiri, profesional, dan keluarga yang membutuhkan proteksi medis.',
      minSumAssured: 50_000_000,
      maxSumAssured: 500_000_000,
      minPaymentTerm: 1,
      maxPaymentTerm: 10,
      startingPremium: 220_000,
      pricingRules: {
        baseRate: 0.0042,
        ageFactors: [
          { minAge: 18, maxAge: 30, factor: 1.0 },
          { minAge: 31, maxAge: 40, factor: 1.2 },
          { minAge: 41, maxAge: 50, factor: 1.6 },
          { minAge: 51, maxAge: 60, factor: 2.2 },
        ],
        genderFactors: { male: 1.03, female: 1.0 },
        smokerFactors: { yes: 1.25, no: 1.0 },
        occupationFactors: { low: 0.95, standard: 1.0, high: 1.25 },
        healthFactors: { low: 1.0, medium: 1.3, high: 1.9 },
        frequencyLoading: { annual: 1.0, semiAnnual: 1.02, quarterly: 1.035, monthly: 1.06 },
      },
      benefits: [
        'Kamar rawat inap VIP / 1 tempat tidur',
        'Cover biaya pembedahan darurat & anestesi',
        'Rawat jalan darurat akibat kecelakaan',
        'Layanan ambulans 24 jam & konsultasi dokter telemedis',
      ],
      exclusions: [
        'Prosedur kosmetik atau estetika',
        'Pengobatan alternatif non-medis tanpa rujukan dokter spesialis',
        'Percobaan bunuh diri atau kelalaian disengaja',
      ],
      isFeatured: true,
      activePoliciesCount: 472,
      grossWrittenPremium: 4_130_000_000,
      lossRatio: 18.5,
      createdAt: '2026-01-15T09:00:00Z',
      updatedAt: '2026-09-02T14:15:00Z',
    },
    {
      id: 'prod_auto_shield_comprehensive',
      name: 'Auto Shield Comprehensive',
      slug: 'auto-shield-comprehensive',
      category: 'vehicle',
      status: 'active',
      shortDescription: 'Proteksi lengkap all-risk untuk kendaraan bermotor roda empat.',
      description:
        'Melindungi kendaraan pribadi dari kerusakan akibat tabrakan, tergelincir, pencurian, bencana banjir, serta opsi tanggung jawab hukum pihak ketiga.',
      targetCustomer: 'Pemilik kendaraan pribadi mobil dan operasional komersial ringan.',
      minSumAssured: 75_000_000,
      maxSumAssured: 750_000_000,
      minPaymentTerm: 1,
      maxPaymentTerm: 5,
      startingPremium: 95_000,
      pricingRules: {
        baseRate: 0.012,
        ageFactors: [
          { minAge: 18, maxAge: 25, factor: 1.25 },
          { minAge: 26, maxAge: 45, factor: 1.0 },
          { minAge: 46, maxAge: 60, factor: 1.1 },
        ],
        genderFactors: { male: 1.0, female: 1.0 },
        smokerFactors: { yes: 1.0, no: 1.0 },
        occupationFactors: { low: 0.95, standard: 1.0, high: 1.15 },
        healthFactors: { low: 1.0, medium: 1.0, high: 1.0 },
        frequencyLoading: { annual: 1.0, semiAnnual: 1.015, quarterly: 1.025, monthly: 1.04 },
      },
      benefits: [
        'Klaim kerugian total & sebagian (All Risk Comprehensive)',
        'Ganti rugi kehilangan akibat pencurian kendaraan',
        'Tanggung jawab hukum pihak ketiga hingga Rp 50.000.000',
        'Bengkel rekanan resmi Authorized & derek darurat 24/7',
      ],
      exclusions: [
        'Mengemudi tanpa SIM yang sah atau di bawah pengaruh alkohol',
        'Penggunaan kendaraan untuk balapan liar',
        'Overloading muatan kendaraan di luar kapasitas resmi',
      ],
      isFeatured: true,
      activePoliciesCount: 146,
      grossWrittenPremium: 1_370_000_000,
      lossRatio: 24.1,
      createdAt: '2026-02-01T11:00:00Z',
      updatedAt: '2026-09-04T16:20:00Z',
    },
    {
      id: 'prod_critical_care_shield',
      name: 'Critical Care Shield',
      slug: 'critical-care-shield',
      category: 'health',
      status: 'draft',
      shortDescription: 'Perlindungan khusus stadium awal 50 penyakit kritis utama.',
      description:
        'Memberikan dana tunai lump-sum saat pertama kali terdiagnosa salah satu dari 50 penyakit kritis utama (Kanker, Stroke, Jantung, dll.) untuk pemulihan finansial.',
      targetCustomer: 'Pekerja profesional usia produktif dengan riwayat keluarga rentan sakit kritis.',
      minSumAssured: 150_000_000,
      maxSumAssured: 1_500_000_000,
      minPaymentTerm: 5,
      maxPaymentTerm: 25,
      startingPremium: 275_000,
      pricingRules: {
        baseRate: 0.0055,
        ageFactors: [
          { minAge: 18, maxAge: 30, factor: 1.0 },
          { minAge: 31, maxAge: 40, factor: 1.35 },
          { minAge: 41, maxAge: 50, factor: 1.95 },
          { minAge: 51, maxAge: 60, factor: 2.85 },
        ],
        genderFactors: { male: 1.08, female: 1.0 },
        smokerFactors: { yes: 1.45, no: 1.0 },
        occupationFactors: { low: 0.95, standard: 1.0, high: 1.3 },
        healthFactors: { low: 1.0, medium: 1.4, high: 2.1 },
        frequencyLoading: { annual: 1.0, semiAnnual: 1.02, quarterly: 1.035, monthly: 1.06 },
      },
      benefits: [
        'Santunan tunai seketika 100% UP pada diagnosis awal',
        'Pembebasan premi lanjutan jika terdiagnosa kondisi kritis',
        'Second medical opinion dari spesialis internasional',
      ],
      exclusions: [
        'Masa tunggu 90 hari pertama sejak polis aktif',
        'Kelainan bawaan lahir kongenital yang tidak dideklarasikan',
      ],
      isFeatured: false,
      activePoliciesCount: 0,
      grossWrittenPremium: 0,
      lossRatio: 0,
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-25T12:00:00Z',
    },
  ];

  async getProducts(category?: ProductCategory, status?: ProductStatus): Promise<InsuranceProduct[]> {
    let list = this.products;
    if (category) {
      list = list.filter((p) => p.category === category);
    }
    if (status) {
      list = list.filter((p) => p.status === status);
    }
    return Promise.resolve(structuredClone(list));
  }

  async getProductById(id: string): Promise<InsuranceProduct | null> {
    const product = this.products.find((p) => p.id === id);
    if (!product) return Promise.resolve(null);
    return Promise.resolve(structuredClone(product));
  }

  async getProductBySlug(slug: string): Promise<InsuranceProduct | null> {
    const product = this.products.find((p) => p.slug === slug);
    if (!product) return Promise.resolve(null);
    return Promise.resolve(structuredClone(product));
  }

  async createProduct(dto: CreateProductDTO): Promise<InsuranceProduct> {
    const existing = this.products.find((p) => p.slug === dto.slug);
    if (existing) {
      throw new Error(`Produk dengan slug "${dto.slug}" sudah terdaftar.`);
    }

    const newId = `prod_${dto.slug.replace(/-/g, '_')}`;
    const now = new Date().toISOString();

    const newProduct: InsuranceProduct = {
      id: newId,
      name: dto.name,
      slug: dto.slug,
      category: dto.category,
      status: dto.status ?? 'draft',
      shortDescription: dto.shortDescription,
      description: dto.description,
      targetCustomer: dto.targetCustomer,
      minSumAssured: dto.minSumAssured,
      maxSumAssured: dto.maxSumAssured,
      minPaymentTerm: dto.minPaymentTerm,
      maxPaymentTerm: dto.maxPaymentTerm,
      startingPremium: dto.startingPremium,
      pricingRules: {
        ...DEFAULT_PRICING_RULES,
        ...dto.pricingRules,
      },
      benefits: dto.benefits.length > 0 ? dto.benefits : ['Perlindungan dasar asuransi'],
      exclusions: dto.exclusions.length > 0 ? dto.exclusions : ['Tindakan melanggar hukum'],
      isFeatured: dto.isFeatured ?? false,
      activePoliciesCount: 0,
      grossWrittenPremium: 0,
      lossRatio: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.products.push(newProduct);
    return Promise.resolve(structuredClone(newProduct));
  }

  async updateProduct(id: string, dto: UpdateProductDTO): Promise<InsuranceProduct> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Produk dengan ID "${id}" tidak ditemukan.`);
    }

    if (dto.slug) {
      const conflict = this.products.find((p) => p.slug === dto.slug && p.id !== id);
      if (conflict) {
        throw new Error(`Produk dengan slug "${dto.slug}" sudah digunakan oleh produk lain.`);
      }
    }

    const current = this.products[index];
    const updated: InsuranceProduct = {
      ...current,
      ...dto,
      pricingRules: dto.pricingRules
        ? { ...current.pricingRules, ...dto.pricingRules }
        : current.pricingRules,
      updatedAt: new Date().toISOString(),
    };

    this.products[index] = updated;
    return Promise.resolve(structuredClone(updated));
  }

  async toggleProductStatus(id: string): Promise<InsuranceProduct> {
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new Error(`Produk dengan ID "${id}" tidak ditemukan.`);
    }

    // Toggle between active and draft
    product.status = product.status === 'active' ? 'draft' : 'active';
    product.updatedAt = new Date().toISOString();

    return Promise.resolve(structuredClone(product));
  }

  async getProductMetrics(): Promise<ProductMetrics> {
    const totalProducts = this.products.length;
    const activeProducts = this.products.filter((p) => p.status === 'active').length;
    const draftProducts = this.products.filter((p) => p.status === 'draft').length;

    let totalActivePolicies = 0;
    let totalGwpVolume = 0;
    let weightedLossRatioSum = 0;

    for (const p of this.products) {
      totalActivePolicies += p.activePoliciesCount;
      totalGwpVolume += p.grossWrittenPremium;
      weightedLossRatioSum += p.lossRatio * p.activePoliciesCount;
    }

    const averageLossRatio =
      totalActivePolicies > 0
        ? Number((weightedLossRatioSum / totalActivePolicies).toFixed(1))
        : 0;

    const billions = (totalGwpVolume / 1_000_000_000).toFixed(2);

    return Promise.resolve({
      totalProducts,
      activeProducts,
      draftProducts,
      totalActivePolicies,
      totalGwpVolume,
      totalGwpVolumeFormatted: `Rp ${billions} Miliar`,
      averageLossRatio,
    });
  }
}
