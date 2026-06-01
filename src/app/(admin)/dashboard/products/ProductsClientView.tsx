'use client';

import { useState, useEffect } from 'react';
import { cjProxyAction } from '@/lib/actions-catalog';
import { importProductAction } from '@/lib/actions-admin-inventory';
import { toast } from 'react-hot-toast';
import { formatUSD } from '@/lib/utils';
import Link from 'next/link';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
}

interface ProductsClientViewProps {
  importedCjIds: string[];
  categoryTree: CategoryNode[];
}

export default function ProductsClientView({ importedCjIds: initialImportedIds, categoryTree }: ProductsClientViewProps) {
  const [importedIds, setImportedIds] = useState<Set<string>>(() => new Set(initialImportedIds));
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter state
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('All Categories');
  const [pageNum, setPageNum] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(100);

  // Mega Menu state
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [activeL1, setActiveL1] = useState<CategoryNode | null>(categoryTree[0] || null);
  const [activeL2, setActiveL2] = useState<CategoryNode | null>(null);

  // Auto-initialize active L1 if tree is loaded
  useEffect(() => {
    if (categoryTree.length > 0 && !activeL1) {
      setActiveL1(categoryTree[0]);
    }
  }, [categoryTree]);

  // Import tracking state
  const [importingId, setImportingId] = useState<string | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState(0);
  const [heroState, setHeroState] = useState<Record<string, boolean>>({});
  const [selectedImageProduct, setSelectedImageProduct] = useState<any | null>(null);

  // Advanced Filter state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchType, setSearchType] = useState('0'); // 0=all, 2=trending
  const [countryCode, setCountryCode] = useState(''); // US, CN, etc.
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch catalog from CJ Dropshipping
  const fetchCjProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        pageNum: pageNum.toString(),
        pageSize: pageSize.toString(),
      });
      if (keyword.trim()) params.set('keyWord', keyword.trim());
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (minPrice.trim()) params.set('minPrice', minPrice.trim());
      if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim());
      if (searchType !== '0') params.set('searchType', searchType);
      if (countryCode.trim()) params.set('countryCode', countryCode.trim());

      // Call CJ proxy endpoint
      const res = await cjProxyAction(`/v1/product/list?${params.toString()}`) as any;
      
      if (res.success && res.data) {
        setProducts(res.data.list || []);
        setTotalRecords(res.data.total || 0);
      } else {
        if (res.status === 429 || res.message?.toLowerCase().includes('qps')) {
          setError('⚠️ CJ Dropshipping API limit reached. Retrying automatically in a few seconds...');
          // Auto retry after 5 seconds to bypass throttle
          setTimeout(() => {
            fetchCjProducts();
          }, 6000);
        } else {
          setError(res.message || 'Failed to retrieve CJ Products catalog.');
        }
        setProducts([]);
        setTotalRecords(0);
      }
    } catch (err: any) {
      console.error(err);
      setError('❌ System error retrieving catalog.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on parameter changes
  useEffect(() => {
    fetchCjProducts();
  }, [pageNum, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageNum(1);
    fetchCjProducts();
  };

  const handleImport = async (p: any) => {
    const isHero = !!heroState[p.pid];
    setImportingId(p.pid);
    
    try {
      let parsedPrice = 0;
      if (typeof p.sellPrice === 'number') {
        parsedPrice = p.sellPrice;
      } else if (p.sellPrice) {
        parsedPrice = parseFloat(String(p.sellPrice)) || 0;
      }
      if (isNaN(parsedPrice)) {
        parsedPrice = 0;
      }

      const productData = {
        pid: p.pid,
        name: p.productNameEn || p.productName || 'Imported Product',
        image: p.productImage || p.bigImage || '',
        sellPrice: parsedPrice,
        categoryName: p.categoryName || 'Imported'
      };

      const res = await importProductAction(productData, isHero);
      if (res.success) {
        setImportedIds(prev => {
          const next = new Set(prev);
          next.add(p.pid);
          return next;
        });
        if (!isBulkImporting) {
          toast.success(`🎉 ${productData.name.slice(0, 30)}... imported successfully! Variants sync is running in the background.`);
        }
      } else {
        if (!isBulkImporting) {
          toast.error(`❌ Import failed: ${res.error || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      if (!isBulkImporting) {
        toast.error(`❌ System error: ${err.message}`);
      }
    } finally {
      setImportingId(null);
    }
  };

  const handleBulkImport = async () => {
    const toImport = products.filter(p => !importedIds.has(p.pid));
    if (toImport.length === 0) {
      toast.error('No new products to import on this page.');
      return;
    }

    if (!window.confirm(`Are you sure you want to import ${toImport.length} products from this page?`)) {
      return;
    }

    setIsBulkImporting(true);
    setBulkImportProgress(0);
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toImport.length; i++) {
      const p = toImport[i];
      setBulkImportProgress(Math.round(((i + 1) / toImport.length) * 100));
      
      try {
        let parsedPrice = 0;
        if (typeof p.sellPrice === 'number') {
          parsedPrice = p.sellPrice;
        } else if (p.sellPrice) {
          parsedPrice = parseFloat(String(p.sellPrice)) || 0;
        }
        if (isNaN(parsedPrice)) parsedPrice = 0;

        const productData = {
          pid: p.pid,
          name: p.productNameEn || p.productName || 'Imported Product',
          image: p.productImage || p.bigImage || '',
          sellPrice: parsedPrice,
          categoryName: p.categoryName || 'Imported'
        };

        const res = await importProductAction(productData, false);
        if (res.success) {
          successCount++;
          setImportedIds(prev => {
            const next = new Set(prev);
            next.add(p.pid);
            return next;
          });
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
      
      // Small pause to be gentle on the browser and server actions
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsBulkImporting(false);
    toast.success(`✅ Bulk import finished: ${successCount} successful, ${failCount} failed.`);
  };

  const selectCategory = (id: string, name: string) => {
    setSelectedCategory(id);
    setSelectedCategoryName(name);
    setPageNum(1);
    setShowMegaMenu(false);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  const inputClass = "px-4 py-2.5 rounded-[8px] border border-[#E2E8F0] bg-gray-50 text-sm font-semibold outline-none focus:border-[#FF6B00] focus:shadow-[0_0_0_3px_#FFF3E0] focus:bg-white transition-all duration-200";
  const buttonClass = "px-5 py-2.5 rounded-[8px] font-bold text-sm bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-sm transition-all duration-200 flex items-center justify-center gap-2";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-black text-[#1E293B]">CJ Catalog Finder</h2>
          <p className="text-[#64748B] font-semibold">Browse millions of CJ Dropshipping products and import them instantly into your inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          {products.length > 0 && (
            <button
              onClick={handleBulkImport}
              disabled={isBulkImporting || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold bg-[#1E293B] text-white hover:bg-black transition-all duration-200 shadow-sm disabled:opacity-50"
            >
              {isBulkImporting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> {bulkImportProgress}% Importing...
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-download-alt"></i> Bulk Import ({products.filter(p => !importedIds.has(p.pid)).length})
                </>
              )}
            </button>
          )}
          <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 no-underline shadow-xs">
            <i className="fas fa-boxes text-[#FF6B00]"></i> Go to Inventory
          </Link>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <form onSubmit={handleSearchSubmit} className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-xs grid grid-cols-1 md:grid-cols-[280px_1fr_130px] gap-4 items-end">
        {/* Category Mega Menu Selector */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Category Filter</label>
          <div className="relative">
            <button
              type="button"
              className={inputClass + " w-full text-left bg-white flex items-center justify-between cursor-pointer"}
              onClick={() => setShowMegaMenu(!showMegaMenu)}
            >
              <span className="truncate font-semibold text-[#1E293B]">{selectedCategoryName}</span>
              <i className={`fas fa-chevron-down text-gray-400 transition-transform duration-200 ${showMegaMenu ? 'rotate-180' : ''}`}></i>
            </button>

            {showMegaMenu && (
              <>
                {/* Backdrop overlay to catch click-away */}
                <div className="fixed inset-0 z-[90] bg-transparent" onClick={() => setShowMegaMenu(false)} />
                
                {/* Megamenu Grid */}
                <div className="absolute top-[48px] left-0 w-[90vw] md:w-[760px] bg-white border border-[#E2E8F0] rounded-[16px] shadow-xl p-5 z-[100] grid grid-cols-3 gap-5 animate-fade-in min-h-[350px] max-h-[500px]">
                  
                  {/* Column 1: Level 1 (Categories) */}
                  <div className="border-r border-[#F1F5F9] pr-3 flex flex-col overflow-y-auto">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-3 pb-1 border-b border-[#F1F5F9]">Main Category</p>
                    <button
                      type="button"
                      className={`text-left px-3 py-2 rounded-[8px] text-xs font-bold transition-all duration-150 mb-1 ${!selectedCategory ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`}
                      onClick={() => selectCategory('', 'All Categories')}
                    >
                      🌟 Show All
                    </button>
                    
                    {categoryTree.map((l1) => (
                      <button
                        key={l1.id}
                        type="button"
                        className={`text-left px-3 py-2 rounded-[8px] text-xs font-bold transition-all duration-150 mb-1 flex items-center justify-between ${activeL1?.id === l1.id ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-[#F8FAFC] text-[#475569]'}`}
                        onClick={() => {
                          setActiveL1(l1);
                          setActiveL2(null);
                        }}
                      >
                        <span className="truncate">{l1.name}</span>
                        <i className="fas fa-chevron-right text-[10px] opacity-45"></i>
                      </button>
                    ))}
                  </div>

                  {/* Column 2: Level 2 (Sub-categories) */}
                  <div className="border-r border-[#F1F5F9] px-3 flex flex-col overflow-y-auto">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-3 pb-1 border-b border-[#F1F5F9]">Sub Category</p>
                    
                    {activeL1 && (
                      <button
                        type="button"
                        className="text-left px-3 py-2 rounded-[8px] text-xs font-black text-gray-500 bg-gray-50 border border-dashed border-[#E2E8F0] hover:bg-orange-50 hover:text-[#FF6B00] transition-colors mb-2.5"
                        onClick={() => selectCategory(activeL1.id, `All ${activeL1.name}`)}
                      >
                        🎯 Select All {activeL1.name}
                      </button>
                    )}

                    {activeL1?.children?.map((l2) => (
                      <button
                        key={l2.id}
                        type="button"
                        className={`text-left px-3 py-2 rounded-[8px] text-xs font-bold transition-all duration-150 mb-1 flex items-center justify-between ${activeL2?.id === l2.id ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-[#F8FAFC] text-[#475569]'}`}
                        onClick={() => setActiveL2(l2)}
                      >
                        <span className="truncate">{l2.name}</span>
                        <i className="fas fa-chevron-right text-[10px] opacity-45"></i>
                      </button>
                    ))}
                    
                    {(!activeL1 || !activeL1.children || activeL1.children.length === 0) && (
                      <p className="text-xs text-gray-400 italic text-center py-8">Select a main category first.</p>
                    )}
                  </div>

                  {/* Column 3: Level 3 (Leaf / Import categories) */}
                  <div className="pl-3 flex flex-col overflow-y-auto">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-3 pb-1 border-b border-[#F1F5F9]">Detail Category</p>
                    
                    {activeL2 && (
                      <button
                        type="button"
                        className="text-left px-3 py-2 rounded-[8px] text-xs font-black text-gray-500 bg-gray-50 border border-dashed border-[#E2E8F0] hover:bg-orange-50 hover:text-[#FF6B00] transition-colors mb-2.5"
                        onClick={() => selectCategory(activeL2.id, activeL2.name)}
                      >
                        🎯 Select All {activeL2.name}
                      </button>
                    )}

                    {activeL2?.children?.map((l3) => (
                      <button
                        key={l3.id}
                        type="button"
                        className="text-left px-3 py-2 rounded-[8px] text-xs font-bold hover:bg-[#FFF8F2] hover:text-[#FF6B00] text-[#475569] transition-all mb-1 truncate"
                        onClick={() => selectCategory(l3.id, l3.name)}
                      >
                        {l3.name}
                      </button>
                    ))}

                    {(!activeL2 || !activeL2.children || activeL2.children.length === 0) && (
                      <p className="text-xs text-gray-400 italic text-center py-8">Select a sub-category to view details.</p>
                    )}
                  </div>

                </div>
              </>
            )}
          </div>
        </div>

        {/* Search Keyword Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Search Keyword</label>
          <input
            type="text"
            className={inputClass + " w-full"}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search keywords, SKU, SPU, descriptions..."
          />
        </div>

        <button type="submit" className={buttonClass + " w-full h-[42px]"}>
          <i className="fas fa-search"></i> Search
        </button>

        {/* Toggle Button for Advanced Filters */}
        <div className="flex justify-end pt-2 col-span-1 md:col-span-3">
          <button
            type="button"
            className="text-xs font-bold text-gray-500 hover:text-[#FF6B00] transition-colors flex items-center gap-1.5 cursor-pointer bg-none border-none outline-none"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <i className={`fas ${showAdvanced ? 'fa-chevron-up' : 'fa-sliders-h'}`}></i>
            {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 col-span-1 md:col-span-3 pt-5 border-t border-[#F1F5F9] animate-fade-in">
            {/* Price range */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Price Range (USD)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className={inputClass + " w-full h-[38px] text-xs"}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                />
                <span className="text-gray-300">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  className={inputClass + " w-full h-[38px] text-xs"}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Catalog Type / Sort */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Sort & Catalog Type</label>
              <select
                className={inputClass + " w-full h-[38px] text-xs bg-white cursor-pointer"}
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="0">🌐 Best Match (Default)</option>
                <option value="1">✨ New Arrivals (Newest)</option>
                <option value="2">🔥 Trending Dropship Products</option>
                <option value="3">📹 Video Products Only</option>
              </select>
            </div>

            {/* Dispatch Country Code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Dispatched Warehouse</label>
              <select
                className={inputClass + " w-full h-[38px] text-xs bg-white cursor-pointer"}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                <option value="">🌎 Any Warehouse Country</option>
                <option value="US">🇺🇸 United States (US)</option>
                <option value="CN">🇨🇳 China (CN)</option>
                <option value="DE">🇩🇪 Germany (DE)</option>
                <option value="GB">🇬🇧 United Kingdom (GB)</option>
                <option value="FR">🇫🇷 France (FR)</option>
                <option value="AU">🇦🇺 Australia (AU)</option>
                <option value="CA">🇨🇦 Canada (CA)</option>
              </select>
            </div>
          </div>
        )}
      </form>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-[12px] text-amber-800 text-sm font-semibold shadow-xs">
          <i className="fas fa-exclamation-triangle text-amber-500 fa-lg"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Products Grid catalog */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="bg-white rounded-[12px] border border-[#E2E8F0] h-[280px] animate-pulse flex flex-col p-3 space-y-3">
              <div className="w-full aspect-square bg-gray-100 rounded-[8px]"></div>
              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              <div className="h-2.5 bg-gray-100 rounded w-1/2"></div>
              <div className="flex justify-between items-center mt-auto">
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                <div className="h-7 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3">
          {products.map((p: any) => {
            const isImported = importedIds.has(p.pid);
            const isImporting = importingId === p.pid;
            const isHero = !!heroState[p.pid];
            
            return (
              <div key={p.pid} className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col overflow-hidden group text-[11px]">
                {/* Image Section */}
                <div 
                  className="relative w-full aspect-square bg-gray-50 overflow-hidden border-b border-[#F1F5F9] cursor-pointer"
                  onClick={() => setSelectedImageProduct(p)}
                >
                  <img
                    src={p.productImage || p.bigImage || '/placeholder.png'}
                    alt={p.productNameEn || p.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Imported Badge */}
                  {isImported && (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                      <i className="fas fa-check-circle"></i> Imported
                    </span>
                  )}

                  {/* Free Shipping Badge */}
                  {p.isFreeShipping && (
                    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]">
                      ✈️ Free
                    </span>
                  )}
                </div>

                {/* Info Section */}
                <div className="p-2.5 flex flex-col flex-1 space-y-1.5">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-extrabold text-[#FF6B00] uppercase tracking-wider truncate">{p.categoryName || 'General'}</p>
                    <h4 className="font-bold text-[10px] text-[#1E293B] line-clamp-2 h-7.5 leading-tight group-hover:text-[#FF6B00] transition-colors cursor-pointer" title={p.productNameEn || p.productName} onClick={() => setSelectedImageProduct(p)}>
                      {p.productNameEn || p.productName}
                    </h4>
                  </div>

                  <div className="flex justify-between items-end mt-auto">
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Cost</p>
                      <p className="font-extrabold text-[10px] text-gray-500">{formatUSD(Number(p.sellPrice || 0))}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-[#FF6B00] uppercase">Retail</p>
                      <p className="font-black text-[11px] text-[#FF6B00]">{formatUSD(Number(p.sellPrice || 0) * 1.35)}</p>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="border-t border-[#F1F5F9] pt-1.5 flex flex-col gap-1">
                    {/* Hero Checkbox */}
                    {!isImported && (
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="accent-[#FF6B00] w-3 h-3 rounded cursor-pointer"
                          checked={isHero}
                          onChange={(e) => setHeroState({ ...heroState, [p.pid]: e.target.checked })}
                          disabled={isImporting}
                        />
                        <span className="text-[8px] font-extrabold text-[#64748B] uppercase tracking-wider">Set Hero</span>
                      </label>
                    )}

                    {/* Import Button */}
                    {isImported ? (
                      <button
                        className="w-full py-1 bg-[#E8F8F0] text-[#065F46] border border-[#A7F3D0] rounded-[6px] text-[9px] font-black flex items-center justify-center gap-1 cursor-default"
                        disabled
                      >
                        <i className="fas fa-check"></i> Imported
                      </button>
                    ) : (
                      <button
                        className={`w-full py-1 rounded-[6px] text-[9px] font-black flex items-center justify-center gap-1 transition-all duration-200 ${
                          isHero 
                            ? 'bg-[#1E293B] text-white hover:bg-black' 
                            : 'bg-orange-50 text-[#FF6B00] border border-[#FF6B00]/20 hover:bg-[#FF6B00] hover:text-white'
                        }`}
                        onClick={() => handleImport(p)}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Importing
                          </>
                        ) : (
                          <>
                            <i className="fas fa-cloud-download-alt"></i> Import
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading ? (
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-16 text-center shadow-xs">
          <div className="text-[50px] text-gray-300 mb-4"><i className="fas fa-box-open"></i></div>
          <h3 className="font-bold text-[#1E293B] text-lg mb-1">No Products Found</h3>
          <p className="text-[#64748B] font-semibold text-sm max-w-[400px] mx-auto">Try refining your search keyword or change the category filter.</p>
        </div>
      ) : null}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-[#E2E8F0] mt-10">
          <button
            className="px-4 py-2 rounded-[8px] text-xs font-black border border-[#E2E8F0] bg-white text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            disabled={pageNum <= 1 || loading}
            onClick={() => setPageNum((prev) => Math.max(1, prev - 1))}
          >
            <i className="fas fa-chevron-left mr-1.5"></i> Previous
          </button>
          
          <span className="text-sm font-bold text-[#64748B]">
            Page {pageNum} of {totalPages} <span className="text-xs text-gray-400 font-semibold">({totalRecords.toLocaleString()} products)</span>
          </span>

          <button
            className="px-4 py-2 rounded-[8px] text-xs font-black border border-[#E2E8F0] bg-white text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            disabled={pageNum >= totalPages || loading}
            onClick={() => setPageNum((prev) => Math.min(totalPages, prev + 1))}
          >
            Next <i className="fas fa-chevron-right ml-1.5"></i>
          </button>
        </div>
      )}

      {/* Product Image Modal */}
      {selectedImageProduct && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" onClick={() => setSelectedImageProduct(null)}>
          <div className="bg-white rounded-[16px] overflow-hidden max-w-[760px] w-full border border-gray-100 shadow-2xl relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#F1F5F9]">
              <h4 className="font-bold text-sm text-[#1E293B] truncate pr-8" title={selectedImageProduct.productNameEn || selectedImageProduct.productName}>
                {selectedImageProduct.productNameEn || selectedImageProduct.productName}
              </h4>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-none border-none cursor-pointer" onClick={() => setSelectedImageProduct(null)}>
                <i className="fas fa-times fa-lg"></i>
              </button>
            </div>
            
            {/* Image Container */}
            <div className="p-4 bg-gray-50 flex items-center justify-center max-h-[700px] overflow-hidden">
              <img
                src={selectedImageProduct.productImage || selectedImageProduct.bigImage || '/placeholder.png'}
                alt={selectedImageProduct.productNameEn || selectedImageProduct.productName}
                className="max-w-full max-h-[600px] object-contain rounded-[10px] shadow-sm"
              />
            </div>
            
            {/* Footer with actions */}
            <div className="p-4 border-t border-[#F1F5F9] flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Cost Price</p>
                <p className="font-black text-sm text-[#FF6B00]">{formatUSD(Number(selectedImageProduct.sellPrice || 0))}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {importedIds.has(selectedImageProduct.pid) ? (
                  <button
                    className="px-4 py-2 bg-[#E8F8F0] text-[#065F46] border border-[#A7F3D0] rounded-[8px] text-xs font-black flex items-center justify-center gap-1.5 cursor-default"
                    disabled
                  >
                    <i className="fas fa-check"></i> Imported
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-[#FF6B00] text-white hover:bg-[#E65100] rounded-[8px] text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    onClick={() => {
                      handleImport(selectedImageProduct);
                      setSelectedImageProduct(null);
                    }}
                    disabled={importingId === selectedImageProduct.pid}
                  >
                    {importingId === selectedImageProduct.pid ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Importing
                      </>
                    ) : (
                      <>
                        <i className="fas fa-cloud-download-alt"></i> Import Now
                      </>
                    )}
                  </button>
                )}
                <button
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-[8px] text-xs font-bold text-gray-600 transition-all cursor-pointer"
                  onClick={() => setSelectedImageProduct(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
