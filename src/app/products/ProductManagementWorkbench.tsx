'use client';

import React, { useState, useMemo } from 'react';
import {
  InsuranceProduct,
  ProductMetrics,
  ProductCategory,
  ProductStatus,
  CreateProductDTO,
  UpdateProductDTO,
} from '@/server/repositories/product.repository.interface';
import { productService } from '@/server/di';
import {
  CreateProductModal,
  EditProductModal,
  PremiumSandboxModal,
  PricingRulesModal,
} from '@/components/organisms';

interface ProductManagementWorkbenchProps {
  initialProducts: InsuranceProduct[];
  initialMetrics: ProductMetrics;
}

type CategoryTabKey = 'all' | ProductCategory;
type StatusFilterKey = 'all' | ProductStatus;

export const ProductManagementWorkbench: React.FC<ProductManagementWorkbenchProps> = ({
  initialProducts,
  initialMetrics,
}) => {
  const [products, setProducts] = useState<InsuranceProduct[]>(initialProducts);
  const [metrics, setMetrics] = useState<ProductMetrics>(initialMetrics);

  // Filters
  const [activeCategory, setActiveCategory] = useState<CategoryTabKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<InsuranceProduct | null>(null);
  const [selectedProductForPricing, setSelectedProductForPricing] = useState<InsuranceProduct | null>(null);
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);
  const [sandboxProductId, setSandboxProductId] = useState<string | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const refreshMetrics = async () => {
    try {
      const updatedMetrics = await productService.getProductMetrics();
      setMetrics(updatedMetrics);
    } catch {
      // ignore
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (activeCategory !== 'all' && p.category !== activeCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSlug = p.slug.toLowerCase().includes(q);
        const matchDesc = p.shortDescription.toLowerCase().includes(q);
        const matchBenefit = p.benefits.some((b) => b.toLowerCase().includes(q));
        if (!matchName && !matchSlug && !matchDesc && !matchBenefit) {
          return false;
        }
      }
      return true;
    });
  }, [products, activeCategory, statusFilter, searchQuery]);

  // Handle Create Product
  const handleCreateProduct = async (data: {
    name: string;
    slug: string;
    category: 'life' | 'health' | 'vehicle';
    status: 'ACTIVE' | 'INACTIVE';
    basePremiumMonthly: number;
    minSumAssured: number;
    maxSumAssured: number;
    minAge: number;
    maxAge: number;
    summary: string;
  }) => {
    const createPayload: CreateProductDTO = {
      name: data.name,
      slug: data.slug,
      category: data.category,
      status: data.status === 'ACTIVE' ? 'active' : 'draft',
      shortDescription: data.summary,
      description: data.summary,
      targetCustomer: 'Nasabah Terverifikasi Core & Mobile App',
      minSumAssured: data.minSumAssured,
      maxSumAssured: data.maxSumAssured,
      minPaymentTerm: 1,
      maxPaymentTerm: 20,
      startingPremium: data.basePremiumMonthly,
      benefits: [
        'Santunan perlindungan 100% Uang Pertanggungan',
        'Layanan klaim digital 24/7 dan asistensi darurat',
        'Bebas biaya administrasi polis',
      ],
      exclusions: [
        'Klaim palsu atau kesengajaan yang melanggar hukum',
        'Kondisi kritis pra-eksisting dalam masa tunggu',
      ],
      pricingRules: {
        baseRate: 0.0023,
      },
    };

    try {
      const created = await productService.createProduct(createPayload);
      setProducts((prev) => [...prev, created]);
      await refreshMetrics();
      showToast(`Produk baru "${created.name}" berhasil ditambahkan.`);
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal menambahkan produk baru.';
      showToast(message);
      throw err;
    }
  };

  // Handle Edit Product
  const handleEditProduct = async (updated: InsuranceProduct) => {
    try {
      const updatePayload: UpdateProductDTO = {
        name: updated.name,
        slug: updated.slug,
        category: updated.category,
        status: updated.status,
        shortDescription: updated.shortDescription,
        minSumAssured: updated.minSumAssured,
        maxSumAssured: updated.maxSumAssured,
        startingPremium: updated.startingPremium,
        pricingRules: updated.pricingRules,
      };

      const res = await productService.updateProduct(updated.id, updatePayload);
      setProducts((prev) => prev.map((p) => (p.id === res.id ? res : p)));
      await refreshMetrics();
      showToast(`Produk "${res.name}" berhasil diperbarui.`);
      setSelectedProductForEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal memperbarui konfigurasi produk.';
      showToast(message);
      throw err;
    }
  };

  // Handle Archive Product
  const handleArchiveProduct = async (productId: string) => {
    try {
      const updatePayload: UpdateProductDTO = { status: 'archived' };
      const res = await productService.updateProduct(productId, updatePayload);
      setProducts((prev) => prev.map((p) => (p.id === res.id ? res : p)));
      await refreshMetrics();
      showToast(`Produk "${res.name}" berhasil diarsipkan.`);
      setSelectedProductForEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengarsipkan produk.';
      showToast(message);
      throw err;
    }
  };

  // Handle Save Pricing Rules
  const handleSavePricing = async (updated: InsuranceProduct) => {
    try {
      const updatePayload: UpdateProductDTO = {
        pricingRules: updated.pricingRules,
        minPaymentTerm: updated.minPaymentTerm,
      };
      const res = await productService.updateProduct(updated.id, updatePayload);
      setProducts((prev) => prev.map((p) => (p.id === res.id ? res : p)));
      await refreshMetrics();
      showToast(`Aturan pricing untuk "${res.name}" berhasil diperbarui.`);
      setSelectedProductForPricing(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal memperbarui aturan pricing.';
      showToast(message);
      throw err;
    }
  };

  // Toggle Status
  const handleToggleStatus = async (product: InsuranceProduct) => {
    try {
      const updated = await productService.toggleProductStatus(product.id);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      await refreshMetrics();
      showToast(
        `Status produk "${product.name}" diubah menjadi ${
          updated.status === 'active' ? 'Aktif' : 'Draft'
        }.`
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message);
      } else {
        showToast('Gagal mengubah status produk.');
      }
    }
  };

  const getCategoryBadge = (cat: ProductCategory) => {
    switch (cat) {
      case 'life':
        return {
          label: 'life',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'health':
        return {
          label: 'health',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'vehicle':
        return {
          label: 'vehicle',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      default:
        return {
          label: cat,
          className: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss toast"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            aria-label="Manajemen Produk & Aturan Underwriting"
            className="text-2xl font-extrabold text-slate-900 tracking-tight"
          >
            Manajemen Produk &amp; Pricing Engine Rules
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pengelolaan katalog polis asuransi, rumus algoritma aktuaria, koefisien premi risiko, dan simulasi penawaran.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <span>+</span>
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards (Board 1 lines 154-194) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Produk Aktif Terdaftar
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm">🛡️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.totalProducts} <span className="text-sm font-normal text-slate-500">Produk</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>Life, Health, Vehicle</span>
              <span className="text-slate-300">•</span>
              <span>{metrics.activeProducts} Aktif</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Versi Pricing Engine Actuary
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm">⚙️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              v2.4.0 Live
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold font-mono mt-1">
              POST /products/:slug/quotes
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Aturan Underwriting Aktif
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 text-sm">🧠</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              18 Risk Matrix
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">
              Usia, BMI, Rokok, Wilayah
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Portofolio Premi (GWP)
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm">💰</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.totalGwpVolumeFormatted}
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1">
              98.4% Memenuhi Target SLA Core
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('life')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'life'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Jiwa ({products.filter((p) => p.category === 'life').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('health')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'health'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kesehatan ({products.filter((p) => p.category === 'health').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('vehicle')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'vehicle'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kendaraan ({products.filter((p) => p.category === 'vehicle').length})
          </button>
        </div>

        {/* Search & Status Controls */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              aria-label="Cari produk"
              placeholder="Cari nama, slug, benefit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <select
            aria-label="Filter status produk"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilterKey)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Hanya Aktif</option>
            <option value="draft">Hanya Draft</option>
            <option value="archived">Hanya Diarsip</option>
          </select>
        </div>
      </div>

      {/* Main Table: Katalog Produk Asuransi Core API (Penpot Board 1 lines 252-571) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Katalog Produk Asuransi Core API (GORM Models)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Terhubung langsung ke GET /api/v1/products &amp; GET /api/v1/products/:slug
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 w-fit">
            {filteredProducts.length} Produk Ditampilkan
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-3xl mb-2 block">🛡️</span>
            <h3 className="text-sm font-bold text-slate-800">Tidak ada produk yang sesuai kriteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Coba ganti filter kategori, status, atau kata kunci pencarian Anda untuk melihat produk lainnya.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">NAMA PRODUK &amp; SLUG</th>
                  <th className="py-3 px-4">KATEGORI</th>
                  <th className="py-3 px-4">TARIF DASAR PREMI</th>
                  <th className="py-3 px-4">LIMIT PERTANGGUNGAN</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-5 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((product) => {
                  const catBadge = getCategoryBadge(product.category);
                  const isActive = product.status === 'active';

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Product Name & Slug */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">
                          <span>{product.name}</span>
                          {product.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              ★
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          slug: {product.slug}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider ${catBadge.className}`}
                        >
                          {catBadge.label}
                        </span>
                      </td>

                      {/* Base Premium Rate */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">
                          {product.category === 'vehicle'
                            ? '1.85% OTR / thn'
                            : `${formatIDR(product.startingPremium)} / bln`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {product.category === 'vehicle'
                            ? 'Tergantung plat wilayah'
                            : product.category === 'health'
                            ? 'Inpatient + Rawat Jalan'
                            : 'Tergantung usia & perokok'}
                        </div>
                      </td>

                      {/* Sum Assured Limit */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">
                          {product.category === 'vehicle'
                            ? 'Sesuai Nilai Pasar (OTR)'
                            : product.category === 'health'
                            ? 'Rp 1.00 Miliar / thn'
                            : `${formatIDR(product.minSumAssured)} - ${formatIDR(product.maxSumAssured)}`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {product.category === 'vehicle'
                            ? 'Maks. usia mobil 10 thn'
                            : product.category === 'health'
                            ? 'Cashless 2,000+ RS'
                            : 'Usia masuk: 18 - 60 Thn'}
                        </div>
                      </td>

                      {/* Status + Toggle */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : product.status === 'archived'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {product.status.toUpperCase()}
                          </span>

                          <button
                            type="button"
                            aria-label={`Toggle status untuk ${product.name}`}
                            onClick={() => handleToggleStatus(product)}
                            className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isActive ? 'translate-x-3' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Actions: Edit, Pricing, Uji */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            aria-label={`Edit Konfigurasi ${product.name}`}
                            onClick={() => setSelectedProductForEdit(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Edit</span>
                            <span>✏️</span>
                          </button>

                          <button
                            type="button"
                            aria-label={`Aturan Pricing & Aktuaria ${product.name}`}
                            onClick={() => setSelectedProductForPricing(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Pricing</span>
                            <span>⚙️</span>
                          </button>

                          <button
                            type="button"
                            aria-label={`Uji di Sandbox ${product.name}`}
                            onClick={() => {
                              setSandboxProductId(product.id);
                              setIsSandboxModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Uji</span>
                            <span>🧪</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer text matching Penpot line 567 */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] font-medium text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Model data sinkron dengan database PostgreSQL 16 schema `products` table.</span>
          <span className="font-mono text-[10px] text-slate-400">pgvector v0.7.0 • OpenAI text-embedding-3-small</span>
        </div>
      </div>

      {/* Two Lower Actuarial Matrix Cards (Penpot Board 1 lines 574-850) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Matriks Faktor Risiko Usia & Gaya Hidup */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                  Matriks Faktor Risiko Usia &amp; Gaya Hidup
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Koefisien aktuaria pengali premi dasar (Secure Life &amp; Health Guard).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = products.find((p) => p.category === 'life') || products[0];
                  if (target) setSelectedProductForPricing(target);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Konfigurasi Pricing</span>
                <span>⚙️</span>
              </button>
            </div>

            {/* Age Multipliers Grid */}
            <div className="mt-4 divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
              <div className="p-2.5 bg-slate-50/50 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Usia &lt; 25 Tahun</span>
                <span className="font-mono font-extrabold text-slate-900">0.90x</span>
                <span className="text-[11px] font-medium text-emerald-600">Low Mortality Risk</span>
              </div>
              <div className="p-2.5 bg-white flex items-center justify-between">
                <span className="font-semibold text-slate-700">Usia 25 - 35 Tahun (Base)</span>
                <span className="font-mono font-extrabold text-slate-900">1.00x</span>
                <span className="text-[11px] font-medium text-blue-600">Baseline Standard</span>
              </div>
              <div className="p-2.5 bg-slate-50/50 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Usia 36 - 45 Tahun</span>
                <span className="font-mono font-extrabold text-slate-900">1.25x</span>
                <span className="text-[11px] font-medium text-amber-600">Moderate Risk (+25%)</span>
              </div>
              <div className="p-2.5 bg-white flex items-center justify-between">
                <span className="font-semibold text-slate-700">Usia 46 - 55 Tahun</span>
                <span className="font-mono font-extrabold text-slate-900">1.60x</span>
                <span className="text-[11px] font-medium text-orange-600">Elevated Risk (+60%)</span>
              </div>
              <div className="p-2.5 bg-slate-50/50 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Usia 56 - 65 Tahun</span>
                <span className="font-mono font-extrabold text-slate-900">2.10x</span>
                <span className="text-[11px] font-medium text-rose-600">High Risk Factor (+110%)</span>
              </div>
            </div>

            {/* Smoker Loading Callout */}
            <div className="mt-3.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>🚬</span>
                <span>Koefisien Perokok (Smoker Loading)</span>
              </div>
              <p className="text-[11px] text-amber-900 mt-1">
                Non-Perokok: 1.00x (Normal) • Perokok Aktif: 1.45x (+45% Premi Jiwa &amp; Sakit Kritis)
              </p>
            </div>

            {/* Medical Exam Note */}
            <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              Rule Medical Exam: UP &gt; Rp 1.000.000.000 mewajibkan hasil MCU Lab Rumah Sakit.
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            Diperbarui oleh Actuary Head • Terakhir diubah: 2 Sep 2026
          </div>
        </div>

        {/* Right Card: Matriks Wilayah & Rider Tambahan (Kendaraan) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                  Matriks Wilayah &amp; Rider Tambahan (Kendaraan)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Penyesuaian tarif premi OJK sesuai zonasi wilayah pelat nomor kendaraan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = products.find((p) => p.category === 'vehicle') || products[0];
                  if (target) setSelectedProductForPricing(target);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Konfigurasi Pricing</span>
                <span>⚙️</span>
              </button>
            </div>

            {/* Zones Grid */}
            <div className="mt-4 divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
              <div className="p-2.5 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">
                    Wilayah 1 (Sumatera &amp; Sekitarnya)
                  </div>
                  <div className="text-[10px] text-slate-400">Plat BA, BK, BM, dkk.</div>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">1.75%</div>
              </div>

              <div className="p-2.5 bg-white flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">
                    Wilayah 2 (DKI Jakarta, Jabar, Banten)
                  </div>
                  <div className="text-[10px] text-slate-400">Plat B, D, F, A (Kepadatan Tinggi)</div>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">1.85%</div>
              </div>

              <div className="p-2.5 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">
                    Wilayah 3 (Jateng, Jatim, Bali, Lainnya)
                  </div>
                  <div className="text-[10px] text-slate-400">Plat H, L, DK, dkk.</div>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">1.65%</div>
              </div>
            </div>

            {/* Optional Riders */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-800 text-[11px]">
                Perluasan Manfaat Tambahan (Riders Optional):
              </div>
              <ul className="text-[10px] text-slate-600 space-y-0.5">
                <li>• Tanggung Jawab Hukum Pihak Ketiga (TJH III s/d 50 Jt): +Rp 150.000 / thn</li>
                <li>• Jaminan Bencana Alam (Banjir, Angin Topan, Gempa): +0.25% dari Harga Pasar Mobil</li>
                <li>• Huru-hara, Kerusuhan &amp; Terorisme (SRCC): +0.15% dari Harga Pasar Mobil</li>
              </ul>
            </div>

            {/* Deductible Note */}
            <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              Batas Deductible Polis (Own Risk): Rp 300.000 per kejadian klaim.
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            Sesuai Surat Edaran Otoritas Jasa Keuangan (OJK) No. 06/D.05/2017.
          </div>
        </div>
      </div>

      {/* 4 ACTION MODALS */}
      {/* 1. Modal Tambah Produk (Board 2) */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitCreate={handleCreateProduct}
      />

      {/* 2. Modal Edit Produk & Re-Index (Board 3) */}
      <EditProductModal
        isOpen={Boolean(selectedProductForEdit)}
        product={selectedProductForEdit}
        onClose={() => setSelectedProductForEdit(null)}
        onSubmitEdit={handleEditProduct}
        onArchiveProduct={handleArchiveProduct}
      />

      {/* 3. Modal Editor Pricing Rules (Board 5) */}
      <PricingRulesModal
        isOpen={Boolean(selectedProductForPricing)}
        product={selectedProductForPricing}
        onClose={() => setSelectedProductForPricing(null)}
        onSavePricingRules={handleSavePricing}
        onOpenSandbox={(prodId) => {
          setSelectedProductForPricing(null);
          setSandboxProductId(prodId);
          setIsSandboxModalOpen(true);
        }}
      />

      {/* 4. Modal Sandbox Kalkulasi Premi (Board 4) */}
      <PremiumSandboxModal
        isOpen={isSandboxModalOpen}
        products={products}
        initialProductId={sandboxProductId}
        onClose={() => setIsSandboxModalOpen(false)}
      />
    </div>
  );
};
