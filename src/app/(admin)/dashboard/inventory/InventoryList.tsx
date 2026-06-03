'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSettings } from '@/context/SettingsContext';
import { slugify, parseProductName } from '@/lib/utils';
import { 
  updateAdminInventoryAction, 
  syncAdminInventoryAction, 
  deleteAdminProductAction, 
  exportToBlogAction
} from '@/lib/actions-admin-inventory';

interface Variant {
  id: string;
  cjId: string;
  sku: string;
  color: string | null;
  size: string | null;
  inventory: number;
  sellingPrice: number;
  baseCost: number;
  image: string | null;
}

interface Product {
  id: string;
  cjId: string;
  name: string;
  images: string[];
  variants: Variant[];
  isHero: boolean;
}

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
}

export default function InventoryList({ 
  initialProducts, 
  total = 0, 
  currentPage = 1,
  limit = 20,
  search = '',
  categoryTree = [],
  currentCategory = '',
  currentSort = 'newest',
  activeCoupons = []
}: { 
  initialProducts: any[], 
  total?: number, 
  currentPage?: number,
  limit?: number,
  search?: string,
  categoryTree?: CategoryNode[],
  currentCategory?: string,
  currentSort?: string,
  activeCoupons?: any[]
}) {

  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [localSearch, setLocalSearch] = useState(search);
  
  // Update products when initialProducts changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Sync localSearch when search prop changes
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [editingPrice, setEditingPrice] = useState<{ variantId: string; value: string } | null>(null);
  const [exportingBlog, setExportingBlog] = useState<string | null>(null);
  const [exportingBulk, setExportingBulk] = useState(false);
  const [bulkLang, setBulkLang] = useState<'id' | 'en'>('en');
  const { settings } = useSettings();

  // Mega Menu state
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [activeL1, setActiveL1] = useState<CategoryNode | null>(categoryTree[0] || null);
  const [activeL2, setActiveL2] = useState<CategoryNode | null>(null);

  useEffect(() => {
    if (categoryTree.length > 0 && !activeL1) {
      setActiveL1(categoryTree[0]);
    }
  }, [categoryTree, activeL1]);

  const findCategoryName = (nodes: CategoryNode[], targetId: string): string | null => {
    for (const n of nodes) {
      if (n.id === targetId) return n.name;
      if (n.children && n.children.length > 0) {
        const found = findCategoryName(n.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedCategoryName = currentCategory ? findCategoryName(categoryTree, currentCategory) || 'All Categories' : 'All Categories';

  const handleFilterChange = (key: string, value: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    // Reset to page 1 on filter changes except for page changes
    if (key !== 'page') {
      searchParams.set('page', '1');
    }
    router.push(`/dashboard/inventory?${searchParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('search', localSearch);
  };

  const handlePriceEdit = async (variantId: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      showToast('Invalid price', 'error');
      return;
    }
    setLoading(`price-${variantId}`);
    try {
      const data = await updateAdminInventoryAction({ variantId, sellingPrice: price });
      if (data.success) {
        setProducts(products.map(p => ({
          ...p,
          variants: p.variants.map(v => v.id === variantId ? { ...v, sellingPrice: price } : v),
        })));
        showToast('Price updated');
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Update failed', 'error');
    } finally {
      setLoading(null);
      setEditingPrice(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSync = async (e: React.MouseEvent, productId: string, cjId: string) => {
    e.stopPropagation();
    setLoading(`sync-${productId}`);
    try {
      const resData = await syncAdminInventoryAction(cjId);
      if (resData.success && resData.data?.variants) {
        setProducts(products.map(p => p.id === productId ? { ...p, variants: (resData.data.variants || []) as Variant[] } : p));
        showToast('Inventory synced with CJ');
      } else {
        showToast(resData.error || 'Sync failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleToggleHero = async (productId: string, currentStatus: boolean) => {
    setLoading(`hero-${productId}`);
    try {
      const data = await updateAdminInventoryAction({ id: productId, isHero: !currentStatus });
      if (data.success) {
        setProducts(products.map(p => p.id === productId ? { ...p, isHero: data.product?.isHero ?? !currentStatus } : p));
        showToast(`Hero status ${!currentStatus ? 'enabled' : 'disabled'}`);
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Update failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this product from local storage?')) return;
    setLoading(`delete-${productId}`);
    try {
      const data = await deleteAdminProductAction(productId);
      if (data.success) {
        setProducts(products.filter(p => p.id !== productId));
        showToast('Product removed');
      } else {
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch (err: any) {
      showToast('Crash: ' + err.message, 'error');
    } finally {
      setLoading(null);
    }
  };

  // ── CJ Real-time Stock ──────────────────────────────────────────────────
  const [cjStocks, setCjStocks] = useState<Record<string, { total: number; warehouses: any[] }>>({});
  const [productCjLoading, setProductCjLoading] = useState<Record<string, boolean>>({});

  const fetchProductCjStocks = async (productCjId: string) => {
    if (cjStocks[productCjId]) return; // already fetched
    if (productCjLoading[productCjId]) return;
    setProductCjLoading(prev => ({ ...prev, [productCjId]: true }));
    try {
      const res = await fetch(`/api/cj-proxy?endpoint=/api2.0/v1/product/stock/getInventoryByPid?pid=${productCjId}`);
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.variantInventories)) {
        const newStocks: Record<string, { total: number; warehouses: any[] }> = {};
        for (const vi of data.data.variantInventories) {
          if (!vi.vid) continue;
          let total = 0;
          let warehouses: any[] = [];
          if (Array.isArray(vi.inventory)) {
            total = vi.inventory.reduce((sum: number, inv: any) => sum + (Number(inv.totalInventory || inv.totalInventoryNum || 0) || 0), 0);
            warehouses = vi.inventory.map((inv: any) => ({
              areaEn: inv.areaEn || inv.countryNameEn || inv.countryCode || 'Warehouse',
              totalInventoryNum: inv.totalInventory || inv.totalInventoryNum || 0,
            }));
          }
          newStocks[vi.vid] = { total, warehouses };
        }
        setCjStocks(prev => ({ ...prev, ...newStocks }));
      }
    } catch (err) {
      console.error('Failed to fetch CJ stocks for product:', err);
    } finally {
      setProductCjLoading(prev => ({ ...prev, [productCjId]: false }));
    }
  };

  // Trigger CJ stock fetch when a product is expanded
  useEffect(() => {
    if (!expandedId) return;
    const product = products.find(p => p.id === expandedId);
    if (!product) return;
    fetchProductCjStocks(product.cjId);
  }, [expandedId, products]);

  const handleDeleteVariant = async (e: React.MouseEvent, productId: string, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this spec?')) return;
    setLoading(`delete-variant-${variantId}`);
    try {
      const data = await deleteAdminProductAction(undefined, variantId);
      if (data.success) {
        setProducts(products.map(p => {
          if (p.id === productId) {
            return { ...p, variants: p.variants.filter(v => v.id !== variantId) };
          }
          return p;
        }));
        showToast('Variant removed');
      } else {
        showToast(data.error || 'Failed', 'error');
      }
    } catch (err: any) {
      showToast('Error', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleExportToBlog = async (productId: string, lang: 'id' | 'en') => {
    setExportingBlog(`${productId}-${lang}`);
    try {
      const data = await exportToBlogAction(productId, lang);
      if (data.success) {
        showToast(`✅ Blog post (${lang.toUpperCase()}) created!`);
      } else {
        showToast(data.error || 'Export failed', 'error');
      }
    } catch (err) {
      showToast('Export error', 'error');
    } finally {
      setExportingBlog(null);
    }
  };

  const handleBulkExportToBlog = async (lang: 'id' | 'en') => {
    setExportingBulk(true);
    let success = 0;
    let skipped = 0;
    let errors = 0;
    for (const p of products) {
      try {
        const data = await exportToBlogAction(p.id, lang);
        if (data.success) success++;
        else if (data.status === 409) skipped++;
        else errors++;
      } catch {
        errors++;
      }
    }
    setExportingBulk(false);
    showToast(`✅ ${success} exported (${lang.toUpperCase()}), ${skipped} skipped, ${errors} errors`);
  };

  const totalPages = Math.ceil(total / limit);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 8;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-all duration-200 border ${
            currentPage === i
              ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => handleFilterChange('page', String(i))}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg transition-all duration-300 ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
          {toast.message}
        </div>
      )}

      {/* Filter, Search, and Sort Controls */}
      <div className="px-5 py-5 border-b border-gray-100 flex flex-col lg:flex-row gap-5 bg-white items-end justify-between">
        
        {/* Category megamenu & Limit selector */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Category megamenu filter */}
          <div className="flex-1 sm:flex-initial relative">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Category Filter</label>
            <button 
              type="button" 
              className="w-full sm:w-[240px] px-4 py-2 border border-gray-200 rounded-[10px] text-sm font-semibold text-gray-700 outline-none focus:border-[#FF6B00] transition-colors bg-gray-50 hover:bg-white flex items-center justify-between cursor-pointer h-[38px]" 
              onClick={() => setShowMegaMenu(!showMegaMenu)}
            >
              <span className="truncate text-sm">{selectedCategoryName}</span>
              <i className={`fas fa-chevron-down text-gray-400 text-[10px] transition-transform ${showMegaMenu ? 'rotate-180' : ''}`}></i>
            </button>

            {showMegaMenu && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowMegaMenu(false)} />
                <div className="absolute top-full left-0 w-full sm:w-[680px] bg-white border border-[#E2E8F0] rounded-[12px] shadow-2xl p-4 z-50 grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-[450px] overflow-y-auto mt-2">
                  <div className="border-b sm:border-b-0 sm:border-r border-[#F1F5F9] pb-3 sm:pb-0 sm:pr-2">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-2">Main</p>
                    <button type="button" className={`block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold mb-0.5 ${!currentCategory ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => { handleFilterChange('categoryId', ''); setShowMegaMenu(false); }}>🌟 All Categories</button>
                    {categoryTree.map(l1 => (
                      <button key={l1.id} type="button" className={`block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold mb-0.5 ${activeL1?.id === l1.id ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => { setActiveL1(l1); setActiveL2(null); }}>
                        {l1.name}
                      </button>
                    ))}
                  </div>
                  <div className="border-b sm:border-b-0 sm:border-r border-[#F1F5F9] py-3 sm:py-0 sm:px-2">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-2">Sub</p>
                    {activeL1 && <button type="button" className="block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold text-gray-500 bg-gray-50 mb-1 hover:bg-orange-50 hover:text-[#FF6B00]" onClick={() => { handleFilterChange('categoryId', activeL1.id); setShowMegaMenu(false); }}>🎯 All {activeL1.name}</button>}
                    {activeL1?.children?.map(l2 => (
                      <button key={l2.id} type="button" className={`block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold mb-0.5 ${activeL2?.id === l2.id ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => setActiveL2(l2)}>{l2.name}</button>
                    ))}
                  </div>
                  <div className="pt-3 sm:pt-0 sm:pl-2">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-2">Detail</p>
                    {activeL2 && <button type="button" className="block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold text-gray-500 bg-gray-50 mb-1 hover:bg-orange-50 hover:text-[#FF6B00]" onClick={() => { handleFilterChange('categoryId', activeL2.id); setShowMegaMenu(false); }}>🎯 All {activeL2.name}</button>}
                    {activeL2?.children?.map(l3 => (
                      <button key={l3.id} type="button" className="block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00]" onClick={() => { handleFilterChange('categoryId', l3.id); setShowMegaMenu(false); }}>{l3.name}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Limit / Page Size selector */}
          <div className="w-[100px] shrink-0">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Show</label>
            <select 
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] text-sm font-semibold text-gray-700 outline-none focus:border-[#FF6B00] transition-colors bg-gray-50 hover:bg-white h-[38px] cursor-pointer"
              value={limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-end">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-[280px]">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Search</label>
            <div className="relative">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Product, CJ ID, SKU..." 
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="w-full py-2 pl-9 pr-8 rounded-[10px] border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#FF6B00] focus:bg-white transition-all duration-200 h-[38px]"
              />
              {localSearch && (
                <button 
                  type="button" 
                  onClick={() => { setLocalSearch(''); handleFilterChange('search', ''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-0"
                >
                  <i className="fas fa-times-circle"></i>
                </button>
              )}
            </div>
            <button type="submit" className="hidden">Search</button>
          </form>

          {/* Sort By selector */}
          <div className="w-full sm:w-[160px] shrink-0">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Sort By</label>
            <select 
              className="w-full px-4 py-2 border border-gray-200 rounded-[10px] text-sm font-semibold text-gray-700 outline-none focus:border-[#FF6B00] transition-colors bg-gray-50 hover:bg-white h-[38px] cursor-pointer"
              value={currentSort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="stock_desc">Highest Stock</option>
              <option value="stock_asc">Lowest Stock</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Export All Button */}
      {products.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span className="text-sm text-gray-500 font-medium">
            {products.length} products on this page
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bulk Language:</span>
            <select
              value={bulkLang}
              onChange={(e) => setBulkLang(e.target.value as 'id' | 'en')}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#FF6B00] bg-white cursor-pointer hover:border-gray-300 transition-all"
            >
              <option value="en">🇬🇧 English (EN)</option>
              <option value="id">🇮🇩 Indonesian (ID)</option>
            </select>
            <button
              onClick={() => handleBulkExportToBlog(bulkLang)}
              disabled={exportingBulk}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
            >
              <i className={`fas ${exportingBulk ? 'fa-spinner fa-spin' : 'fa-blog'}`}></i>
              {exportingBulk ? 'Exporting...' : '📝 Export All to Blog'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-[50px] px-5 py-3.5"></th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Product Information</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Variants</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Stock Status</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-[100px] text-gray-400">No products imported yet.</td></tr>
            ) : (
              products.map((p) => (
                <React.Fragment key={p.id}>
                  <tr onClick={() => toggleExpand(p.id)} className={`cursor-pointer border-b border-gray-100 ${expandedId === p.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                    <td className="text-center px-5 py-3.5">
                       <i className={`fas fa-chevron-${expandedId === p.id ? 'down' : 'right'} opacity-30 text-xs`}></i>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-4 items-center">
                        <div className="relative w-[52px] h-[52px] rounded-[12px] overflow-hidden shrink-0 border border-gray-200 shadow-sm">
                           <Image src={p.images[0] || '/placeholder.png'} alt={p.name} fill className="object-cover" unoptimized />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold truncate max-w-[360px] text-gray-800 text-sm">
                            {p.name}
                          </div>
                          <div className="flex gap-2 items-center mt-1">
                             <span className="text-[10px] font-extrabold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">CJ: {p.cjId}</span>
                             {p.isHero && <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-[#FF6B00]">★ Hero</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-[6px] text-xs font-bold bg-blue-100 text-blue-700">{p.variants.length} Specs</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                         <span className="font-black text-base">{p.variants.reduce((acc, v) => acc + v.inventory, 0)}</span>
                         <span className="text-[10px] font-bold uppercase text-gray-400">Total Units</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 justify-end">
                        <button 
                          className="px-2.5 py-1.5 rounded-[8px] text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200"
                          title="Copy Store Link"
                          onClick={(e) => {
                            e.stopPropagation();
                            const displayName = parseProductName(p.name);
                            const slug = slugify(displayName);
                            const url = `${window.location.origin}/product/${p.cjId}/${slug}`;
                            navigator.clipboard.writeText(url).then(() => showToast('Store link copied!'));
                          }}
                        >
                          <i className="fas fa-link"></i>
                        </button>
                        <button 
                          className="px-2.5 py-1.5 rounded-[8px] text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200"
                          title="Refresh from CJ"
                          disabled={loading === `sync-${p.id}`}
                          onClick={(e) => handleSync(e, p.id, p.cjId)}
                        >
                          <i className={`fas fa-sync ${loading === `sync-${p.id}` ? 'fa-spin' : ''}`}></i>
                        </button>
                        <button 
                          className={`px-2.5 py-1.5 rounded-[8px] text-sm border transition-all duration-200 ${p.isHero ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          title="Pin to Hero Section"
                          onClick={(e) => { e.stopPropagation(); handleToggleHero(p.id, p.isHero); }}
                        >
                          <i className={`fa${p.isHero ? 's' : 'r'} fa-star`}></i>
                        </button>

                        <div 
                          className="flex items-center border border-gray-200 rounded-[8px] overflow-hidden bg-white shadow-sm hover:border-gray-300 transition-all shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            title="Export to Indonesian Blog"
                            disabled={exportingBlog !== null}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportToBlog(p.id, 'id');
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-extrabold text-green-600 hover:bg-green-50 transition-colors flex items-center gap-1 border-r border-gray-100 disabled:opacity-50"
                          >
                            {exportingBlog === `${p.id}-id` ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <span>🇮🇩 ID</span>
                            )}
                          </button>
                          <button
                            title="Export to English Blog"
                            disabled={exportingBlog !== null}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportToBlog(p.id, 'en');
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-extrabold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {exportingBlog === `${p.id}-en` ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <span>🇬🇧 EN</span>
                            )}
                          </button>
                        </div>
                        <button 
                          className="px-2.5 py-1.5 rounded-[8px] text-sm border border-gray-200 text-red-500 hover:bg-red-50 transition-all duration-200"
                          title="Delete Product"
                          disabled={loading === `delete-${p.id}`}
                          onClick={(e) => handleDelete(e, p.id)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="p-0">
                        <div className="p-8 border-l-4 border-[#FF6B00]">
                          <div className="bg-white rounded-[12px] border border-gray-200 shadow-sm">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-white">
                                  <th className="bg-transparent px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Specification</th>
                                  <th className="bg-transparent px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Wholesale</th>
                                  <th className="bg-transparent px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Selling (Final)</th>
                                  <th className="bg-transparent px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Local Stock</th>
                                  <th className="bg-transparent px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CJ Stock</th>
                                  <th className="bg-transparent px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.variants.map((v) => {
                                  const cjStock = cjStocks[v.cjId];
                                  const cjLoading = productCjLoading[p.id];
                                  return (
                                    <tr key={v.id} className="border-t border-gray-100">
                                      <td className="px-6 py-3">
                                        <div className="flex gap-3 items-center">
                                          {v.image && <img src={v.image} alt="" className="w-9 h-9 rounded-[8px] border border-gray-200 object-cover" />}
                                          <div>
                                            <div className="font-extrabold text-[13px] text-gray-800">{v.color || 'Standard'} {v.size}</div>
                                            <div className="text-[10px] text-gray-400 font-bold">SKU: {v.sku}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="font-bold px-6 py-3 text-gray-800">${v.baseCost.toFixed(2)}</td>
                                      <td className="px-6 py-3">
                                        {editingPrice?.variantId === v.id ? (
                                          <div className="flex gap-1 items-center">
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={editingPrice.value}
                                              onChange={(e) => setEditingPrice({ variantId: v.id, value: e.target.value })}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handlePriceEdit(v.id, editingPrice.value);
                                                if (e.key === 'Escape') setEditingPrice(null);
                                              }}
                                              className="w-20 px-2 py-1 rounded text-sm font-bold border-2 border-[#FF6B00] outline-none"
                                              autoFocus
                                            />
                                            <button className="px-2 py-1 rounded text-sm bg-[#FF6B00] text-white border-none" onClick={() => handlePriceEdit(v.id, editingPrice.value)} disabled={loading === `price-${v.id}`}>
                                              <i className={`fas ${loading === `price-${v.id}` ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col">
                                            <span
                                              className="inline-block px-2.5 py-1 rounded-[6px] text-[13px] font-black bg-green-100 text-green-700 cursor-pointer w-fit"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingPrice({ variantId: v.id, value: String(v.sellingPrice) });
                                              }}
                                              title="Click to edit price"
                                            >
                                              ${v.sellingPrice.toFixed(2)}
                                            </span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-6 py-3">
                                        <span className={`font-black ${v.inventory < 10 ? 'text-red-500' : 'text-gray-800'}`}>
                                          {v.inventory.toLocaleString()}
                                        </span>
                                      </td>
                                      <td className="px-6 py-3">
                                        {cjLoading ? (
                                          <i className="fas fa-spinner fa-spin text-gray-400"></i>
                                        ) : cjStock ? (
                                          <div className="space-y-1">
                                            <span className={`font-black ${cjStock.total < 10 ? 'text-red-500' : 'text-green-600'}`}>
                                              {cjStock.total.toLocaleString()}
                                            </span>
                                            <div className="text-[10px] text-gray-400 space-y-0.5">
                                              {cjStock.warehouses.slice(0, 2).map((w: any, i: number) => (
                                                <div key={i} className="flex justify-between gap-2">
                                                  <span className="truncate max-w-[80px]">{w.areaEn || w.countryCode}</span>
                                                  <span className="font-medium">{w.totalInventoryNum?.toLocaleString() || 0}</span>
                                                </div>
                                              ))}
                                              {cjStock.warehouses.length > 2 && (
                                                <span className="text-gray-300">+{cjStock.warehouses.length - 2} more</span>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 text-xs">—</span>
                                        )}
                                      </td>
                                      <td className="text-right px-6 py-3">
                                        <button className="px-2 py-1 rounded text-sm text-red-500 hover:bg-red-50 transition-all duration-200" onClick={(e) => handleDeleteVariant(e, p.id, v.id)}>
                                          <i className="fas fa-times"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-white rounded-b-[16px] gap-4">
          <div className="text-sm font-semibold text-gray-500">
            Showing {total === 0 ? 0 : ((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} entries
          </div>
          <div className="flex gap-1.5 items-center flex-wrap">
            <button 
              className="px-3.5 py-1.5 rounded-[8px] text-xs font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 disabled:opacity-30 flex items-center gap-1"
              disabled={currentPage <= 1}
              onClick={() => { 
                const params = new URLSearchParams(window.location.search);
                params.set('page', String(currentPage - 1));
                router.push(`/dashboard/inventory?${params.toString()}`); 
              }}
            >
              <i className="fas fa-chevron-left"></i> Prev
            </button>
            
            {renderPageNumbers()}
            
            <button 
              className="px-3.5 py-1.5 rounded-[8px] text-xs font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 disabled:opacity-30 flex items-center gap-1"
              disabled={currentPage >= totalPages}
              onClick={() => { 
                const params = new URLSearchParams(window.location.search);
                params.set('page', String(currentPage + 1));
                router.push(`/dashboard/inventory?${params.toString()}`); 
              }}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
