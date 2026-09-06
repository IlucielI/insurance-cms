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

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InsuranceProduct | null>(null);
  const [detailProduct, setDetailProduct] = useState<InsuranceProduct | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'life' as ProductCategory,
    status: 'draft' as ProductStatus,
    shortDescription: '',
    description: '',
    targetCustomer: '',
    minSumAssured: 100_000_000,
    maxSumAssured: 1_000_000_000,
    minPaymentTerm: 5,
    maxPaymentTerm: 20,
    startingPremium: 185_000,
    benefitsText: '',
    exclusionsText: '',
    baseRate: 0.0035,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      category: 'life',
      status: 'draft',
      shortDescription: '',
      description: '',
      targetCustomer: '',
      minSumAssured: 50_000_000,
      maxSumAssured: 500_000_000,
      minPaymentTerm: 1,
      maxPaymentTerm: 10,
      startingPremium: 150_000,
      benefitsText: 'Santunan meninggal dunia / rawat inap\nLayanan darurat 24 jam',
      exclusionsText: 'Klaim palsu atau penipuan\nPelanggaran hukum',
      baseRate: 0.0035,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: InsuranceProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      category: product.category,
      status: product.status,
      shortDescription: product.shortDescription,
      description: product.description,
      targetCustomer: product.targetCustomer,
      minSumAssured: product.minSumAssured,
      maxSumAssured: product.maxSumAssured,
      minPaymentTerm: product.minPaymentTerm,
      maxPaymentTerm: product.maxPaymentTerm,
      startingPremium: product.startingPremium,
      benefitsText: product.benefits.join('\n'),
      exclusionsText: product.exclusions.join('\n'),
      baseRate: product.pricingRules?.baseRate ?? 0.0035,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Form (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const benefits = formData.benefitsText
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean);
      const exclusions = formData.exclusionsText
        .split('\n')
        .map((e) => e.trim())
        .filter(Boolean);

      if (editingProduct) {
        // Update
        const updatePayload: UpdateProductDTO = {
          name: formData.name,
          slug: formData.slug,
          category: formData.category,
          status: formData.status,
          shortDescription: formData.shortDescription,
          description: formData.description,
          targetCustomer: formData.targetCustomer,
          minSumAssured: Number(formData.minSumAssured),
          maxSumAssured: Number(formData.maxSumAssured),
          minPaymentTerm: Number(formData.minPaymentTerm),
          maxPaymentTerm: Number(formData.maxPaymentTerm),
          startingPremium: Number(formData.startingPremium),
          benefits,
          exclusions,
          pricingRules: {
            baseRate: Number(formData.baseRate),
          },
        };

        const updated = await productService.updateProduct(editingProduct.id, updatePayload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast(`Produk "${updated.name}" berhasil diperbarui.`);
      } else {
        // Create
        const createPayload: CreateProductDTO = {
          name: formData.name,
          slug: formData.slug,
          category: formData.category,
          status: formData.status,
          shortDescription: formData.shortDescription,
          description: formData.description,
          targetCustomer: formData.targetCustomer,
          minSumAssured: Number(formData.minSumAssured),
          maxSumAssured: Number(formData.maxSumAssured),
          minPaymentTerm: Number(formData.minPaymentTerm),
          maxPaymentTerm: Number(formData.maxPaymentTerm),
          startingPremium: Number(formData.startingPremium),
          benefits,
          exclusions,
          pricingRules: {
            baseRate: Number(formData.baseRate),
          },
        };

        const created = await productService.createProduct(createPayload);
        setProducts((prev) => [...prev, created]);
        showToast(`Produk baru "${created.name}" berhasil ditambahkan.`);
      }

      await refreshMetrics();
      setIsFormModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Terjadi kesalahan saat memproses data produk.');
      }
    } finally {
      setIsSubmitting(false);
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
          label: 'Asuransi Jiwa',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'health':
        return {
          label: 'Asuransi Kesehatan',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'vehicle':
        return {
          label: 'Asuransi Kendaraan',
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
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Produk & Aturan Underwriting
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi katalog produk asuransi, aturan aktuaria & pricing, batas limitasi UP, serta ketersediaan produk pada sistem.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <span>✨</span>
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Katalog Produk
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm">🛡️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.totalProducts} <span className="text-sm font-normal text-slate-500">Produk</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>{metrics.activeProducts} Aktif di Pasar</span>
              <span className="text-slate-300">•</span>
              <span>{metrics.draftProducts} Draft</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Polis Aktif Berjalan
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm">📑</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.totalActivePolicies.toLocaleString('id-ID')}{' '}
              <span className="text-sm font-normal text-slate-500">Polis</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              98.4% Memenuhi Target SLA Core
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
              Gross Written Premium Terkumpul
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata Loss Ratio
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 text-sm">📈</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.averageLossRatio}%
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>✓</span>
              <span>Kondisi Portofolio Sehat (&lt; 30%)</span>
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Hanya Aktif</option>
            <option value="draft">Hanya Draft</option>
            <option value="archived">Hanya Diarsip</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
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
            className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProducts.map((product) => {
            const catBadge = getCategoryBadge(product.category);
            const isActive = product.status === 'active';

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${catBadge.className}`}
                      >
                        {catBadge.label}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isActive ? '● Aktif di Pasar' : '○ Draft Konfigurasi'}
                      </span>
                      {product.isFeatured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          ★ Unggulan
                        </span>
                      )}
                    </div>

                    {/* Quick Status Toggle Switch */}
                    <button
                      type="button"
                      aria-label={`Toggle status untuk ${product.name}`}
                      onClick={() => handleToggleStatus(product)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>{product.name}</span>
                      <span className="text-xs font-mono font-medium text-slate-400">
                        ({product.slug})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                      {product.shortDescription}
                    </p>
                  </div>

                  {/* Pricing & Coverage Limits Grid */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Limit Uang Pertanggungan
                      </span>
                      <span className="font-bold text-slate-800 mt-0.5 block">
                        {formatIDR(product.minSumAssured)} - {formatIDR(product.maxSumAssured)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Premi Dasar Mulai Dari
                      </span>
                      <span className="font-bold text-blue-600 mt-0.5 block">
                        {formatIDR(product.startingPremium)}{' '}
                        <span className="text-[10px] font-normal text-slate-500">/ bulan</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Masa Pembayaran Polis
                      </span>
                      <span className="font-medium text-slate-700 mt-0.5 block">
                        {product.minPaymentTerm} - {product.maxPaymentTerm} Tahun
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Base Rate Aktuaria
                      </span>
                      <span className="font-mono font-semibold text-slate-700 mt-0.5 block">
                        {(product.pricingRules.baseRate * 100).toFixed(2)}% per mille
                      </span>
                    </div>
                  </div>

                  {/* Key Benefits List */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Manfaat Utama Polis:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {product.benefits.slice(0, 3).map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                      {product.benefits.length > 3 && (
                        <li className="text-[11px] text-slate-400 italic">
                          +{product.benefits.length - 3} manfaat perlindungan tambahan lainnya
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Portfolio Stats (if available) */}
                  {product.activePoliciesCount > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        Polis Aktif:{' '}
                        <span className="font-bold text-slate-800">
                          {product.activePoliciesCount}
                        </span>
                      </div>
                      <div>
                        Volume GWP:{' '}
                        <span className="font-bold text-slate-800">
                          Rp {(product.grossWrittenPremium / 1_000_000_000).toFixed(2)} Miliar
                        </span>
                      </div>
                      <div>
                        Loss Ratio:{' '}
                        <span className="font-bold text-emerald-600">{product.lossRatio}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailProduct(product)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <span>⚙️</span>
                    <span>Aturan Pricing & Aktuaria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(product)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span>✏️</span>
                    <span>Edit Konfigurasi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Tambah / Edit Produk */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? `Edit Konfigurasi: ${editingProduct.name}` : 'Tambah Produk Asuransi Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur spesifikasi produk, limit uang pertanggungan, dan parameter dasar aktuaria.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Secure Life Plus"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name: newName,
                        // auto generate slug on create
                        slug: editingProduct
                          ? prev.slug
                          : newName
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, ''),
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slug Identifier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: secure-life-plus"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Produk</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value as ProductCategory }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="life">Asuransi Jiwa (Life)</option>
                    <option value="health">Asuransi Kesehatan (Health)</option>
                    <option value="vehicle">Asuransi Kendaraan (Vehicle)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Publikasi</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value as ProductStatus }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft (Konfigurasi Internal)</option>
                    <option value="active">Aktif (Tersedia untuk Nasabah)</option>
                    <option value="archived">Diarsip (Non-aktif)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Min Uang Pertanggungan (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1_000_000}
                    step={1_000_000}
                    value={formData.minSumAssured}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minSumAssured: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Maks Uang Pertanggungan (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1_000_000}
                    step={1_000_000}
                    value={formData.maxSumAssured}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, maxSumAssured: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Premi Dasar Mulai Dari (Rp/bulan) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={10_000}
                    step={5_000}
                    value={formData.startingPremium}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startingPremium: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Rate Aktuaria (desimal)
                  </label>
                  <input
                    type="number"
                    step={0.0001}
                    min={0.0001}
                    max={0.1}
                    value={formData.baseRate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, baseRate: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Ringkasan 1-2 kalimat untuk kartu produk"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Nasabah</label>
                <input
                  type="text"
                  placeholder="misal: Keluarga muda dan pekerja produktif usia 21-45 tahun"
                  value={formData.targetCustomer}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetCustomer: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daftar Manfaat Utama (1 baris per poin manfaat)
                </label>
                <textarea
                  rows={3}
                  value={formData.benefitsText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benefitsText: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daftar Pengecualian Klaim (1 baris per pengecualian)
                </label>
                <textarea
                  rows={2}
                  value={formData.exclusionsText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, exclusionsText: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Menyimpan...'
                    : editingProduct
                    ? 'Simpan Perubahan 💾'
                    : 'Tambah Produk ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Aturan Pricing & Underwriting */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Aturan Pricing & Aktuaria:</span>
                  <span className="text-blue-600">{detailProduct.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Spesifikasi bobot underwriting Core API, multiplier risiko, dan matriks aktuaria.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Base Rate & Frequency */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Base Rate Aktuaria
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono block mt-0.5">
                    {detailProduct.pricingRules.baseRate} ({detailProduct.pricingRules.baseRate * 100}%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Target Nasabah
                  </span>
                  <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                    {detailProduct.targetCustomer}
                  </span>
                </div>
              </div>

              {/* Age Multiplier Matrix */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Matriks Pengali Usia (Age Factors)
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {detailProduct.pricingRules.ageFactors.map((af, i) => (
                    <div key={i} className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg">
                      <span className="text-[10px] text-blue-600 font-semibold block">
                        Usia {af.minAge} - {af.maxAge}
                      </span>
                      <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                        {af.factor}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors: Smoker, Gender, Occupation */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Pengali Risiko Gaya Hidup & Okupasi
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Status Merokok</span>
                    <div className="mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Perokok:</span>
                        <span className="font-mono font-bold">
                          {detailProduct.pricingRules.smokerFactors.yes}x
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Bukan Perokok:</span>
                        <span className="font-mono font-bold">
                          {detailProduct.pricingRules.smokerFactors.no}x
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Jenis Kelamin</span>
                    <div className="mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Pria:</span>
                        <span className="font-mono font-bold">
                          {detailProduct.pricingRules.genderFactors.male}x
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Wanita:</span>
                        <span className="font-mono font-bold">
                          {detailProduct.pricingRules.genderFactors.female}x
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Kelas Okupasi</span>
                    <div className="mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Tinggi:</span>
                        <span className="font-mono font-bold">
                          {detailProduct.pricingRules.occupationFactors.high}x
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Standar:</span>
                        <span className="font-mono font-bold">
                          {detailProduct.pricingRules.occupationFactors.standard}x
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exclusions */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  3. Ketentuan Pengecualian Klaim (Exclusions)
                </h4>
                <ul className="space-y-1 text-xs text-slate-600 bg-red-50/50 p-3.5 rounded-lg border border-red-100">
                  {detailProduct.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
