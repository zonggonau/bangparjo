'use client';

import { useState, useEffect } from 'react';
import { cjProxyAction } from '@/lib/actions-catalog';
import { importProductAction, fixAllProductCategoriesAction } from '@/lib/actions-admin-inventory';
import { toast } from 'react-hot-toast';
import { formatUSD } from '@/lib/utils';
import Link from 'next/link';

interface CategoryNode {
  id: string;
  cjId?: string;
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
  
  // Selection & Bulk State
  const [selectedPids, setSelectedPids] = useState<Set<string>>(new Set());
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isFixingLinks, setIsFixingLinks] = useState(false);

  // Search & Filter state
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('All Categories');
  const [pageNum, setPageNum] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Mega Menu state
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [activeL1, setActiveL1] = useState<CategoryNode | null>(categoryTree[0] || null);
  const [activeL2, setActiveL2] = useState<CategoryNode | null>(null);

  // Image Preview Modal state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (categoryTree.length > 0 && !activeL1) {
      setActiveL1(categoryTree[0]);
    }
  }, [categoryTree, activeL1]);

  const [importingId, setImportingId] = useState<string | null>(null);
  const [heroState, setHeroState] = useState<Record<string, boolean>>({});

  // Advanced Filter state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchType, setSearchType] = useState('0');
  const [countryCode, setCountryCode] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch catalog dari CJ Dropshipping
  const fetchCjProducts = async () => {
    setLoading(true);
    setError(null);
    setSelectedPids(new Set()); // Reset selection on page change
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

      const res = await cjProxyAction(`/v1/product/list?${params.toString()}`) as any;
      
      if (res.success && res.data) {
        setProducts(res.data.list || []);
        setTotalRecords(res.data.total || 0);
      } else {
        if (res.status === 429 || res.message?.toLowerCase().includes('qps')) {
          setError('⚠️ CJ API limit reached. Auto-retrying...');
          setTimeout(() => fetchCjProducts(), 6000);
        } else {
          setError(res.message || 'Failed to retrieve products.');
        }
        setProducts([]);
        setTotalRecords(0);
      }
    } catch (err: any) {
      setError('❌ System error retrieving catalog.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCjProducts();
  }, [pageNum, selectedCategory, pageSize]);

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
      if (isNaN(parsedPrice)) parsedPrice = 0;

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
        toast.success(`🎉 ${productData.name.slice(0, 40)} imported!`);
      } else {
        toast.error(`❌ Import failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(`❌ System error: ${err.message}`);
    } finally {
      setImportingId(null);
    }
  };

  const handleBulkImport = async () => {
    const pidsToImport = Array.from(selectedPids).filter(pid => !importedIds.has(pid));
    if (pidsToImport.length === 0) {
      toast.error('No new products selected for import.');
      return;
    }

    if (!confirm(`Import ${pidsToImport.length} selected products?`)) return;

    setIsBulkImporting(true);
    let successCount = 0;
    
    for (const pid of pidsToImport) {
      const p = products.find(prod => prod.pid === pid);
      if (!p) continue;
      
      try {
        let parsedPrice = 0;
        if (typeof p.sellPrice === 'number') parsedPrice = p.sellPrice;
        else if (p.sellPrice) parsedPrice = parseFloat(String(p.sellPrice)) || 0;

        const res = await importProductAction({
          pid: p.pid,
          name: p.productNameEn || p.productName || 'Imported Product',
          image: p.productImage || p.bigImage || '',
          sellPrice: parsedPrice,
          categoryName: p.categoryName || 'Imported'
        }, !!heroState[p.pid]);

        if (res.success) {
          successCount++;
          setImportedIds(prev => {
            const next = new Set(prev);
            next.add(pid);
            return next;
          });
        }
      } catch (err) {}
      // Small delay to avoid hammering the API
      await new Promise(r => setTimeout(r, 200));
    }
    
    toast.success(`✅ Successfully imported ${successCount} products.`);
    setSelectedPids(new Set());
    setIsBulkImporting(false);
  };

  const handleFixLinks = async () => {
    if (!confirm('Start automatic category link repair for all products?')) return;
    setIsFixingLinks(true);
    try {
      const res = await fixAllProductCategoriesAction();
      if (res.success) {
        toast.success(res.message || 'Category links fixed.');
      } else {
        toast.error(res.error || 'Failed to fix links.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsFixingLinks(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPids.size === products.length) {
      setSelectedPids(new Set());
    } else {
      setSelectedPids(new Set(products.map(p => p.pid)));
    }
  };

  const toggleSelectOne = (pid: string) => {
    const next = new Set(selectedPids);
    if (next.has(pid)) next.delete(pid);
    else next.add(pid);
    setSelectedPids(next);
  };

  const selectCategory = (id: string, name: string) => {
    setSelectedCategory(id);
    setSelectedCategoryName(name);
    setPageNum(1);
    setShowMegaMenu(false);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1E293B]">CJ Catalog Finder</h2>
          <p className="text-[#64748B] text-sm">Browse & import products from CJ API</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            type="button"
            onClick={handleFixLinks}
            disabled={isFixingLinks}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-all"
          >
            {isFixingLinks ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
            Fix Category Links
          </button>
          <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] no-underline">
            <i className="fas fa-boxes text-[#FF6B00]"></i> Inventory
          </Link>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden shadow-xs relative">
        
        {/* Bulk Action Bar (Overlay) */}
        {selectedPids.size > 0 && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-[#1E293B] text-white px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">{selectedPids.size} products selected</span>
              <button 
                type="button" 
                onClick={() => setSelectedPids(new Set())}
                className="text-xs font-semibold text-gray-400 hover:text-white underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
            <button 
              type="button"
              disabled={isBulkImporting}
              onClick={handleBulkImport}
              className="px-6 py-2 rounded-[8px] bg-[#FF6B00] hover:bg-[#E65100] text-white font-black text-sm transition-all flex items-center gap-2 cursor-pointer border-none shadow-lg"
            >
              {isBulkImporting ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-cloud-download-alt"></i> Import All Selected</>}
            </button>
          </div>
        )}

        {/* Filter, Search, and Controls */}
        <div className="px-5 py-5 border-b border-gray-100 bg-white">
          <div className="flex flex-col lg:flex-row gap-5 items-end justify-between">
            {/* Category megamenu & Limit selector */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Category Filter */}
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
                        <button type="button" className={`block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold mb-0.5 ${!selectedCategory ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => selectCategory('', 'All Categories')}>🌟 All Categories</button>
                        {categoryTree.map(l1 => (
                          <button key={l1.id} type="button" className={`block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold mb-0.5 ${activeL1?.id === l1.id ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => { setActiveL1(l1); setActiveL2(null); }}>
                            {l1.name}
                          </button>
                        ))}
                      </div>
                      <div className="border-b sm:border-b-0 sm:border-r border-[#F1F5F9] py-3 sm:py-0 sm:px-2">
                        <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-2">Sub</p>
                        {activeL1 && <button type="button" className="block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold text-gray-500 bg-gray-50 mb-1 hover:bg-orange-50 hover:text-[#FF6B00]" onClick={() => selectCategory(activeL1.cjId || activeL1.id, `All ${activeL1.name}`)}>🎯 All {activeL1.name}</button>}
                        {activeL1?.children?.map(l2 => (
                          <button key={l2.id} type="button" className={`block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold mb-0.5 ${activeL2?.id === l2.id ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => setActiveL2(l2)}>{l2.name}</button>
                        ))}
                      </div>
                      <div className="pt-3 sm:pt-0 sm:pl-2">
                        <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-2">Detail</p>
                        {activeL2 && <button type="button" className="block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold text-gray-500 bg-gray-50 mb-1 hover:bg-orange-50 hover:text-[#FF6B00]" onClick={() => selectCategory(activeL2.cjId || activeL2.id, activeL2.name)}>🎯 All {activeL2.name}</button>}
                        {activeL2?.children?.map(l3 => (
                          <button key={l3.id} type="button" className="block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00]" onClick={() => selectCategory(l3.cjId || l3.id, l3.name)}>{l3.name}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Limit selector */}
              <div className="w-[100px] shrink-0">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Show</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] text-sm font-semibold text-gray-700 outline-none focus:border-[#FF6B00] transition-colors bg-gray-50 hover:bg-white h-[38px] cursor-pointer"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageNum(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-end">
              {/* Search form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-[280px]">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Search</label>
                <div className="relative">
                  <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input 
                    type="text" 
                    placeholder="Search catalog..." 
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    className="w-full py-2 pl-9 pr-8 rounded-[10px] border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#FF6B00] focus:bg-white transition-all duration-200 h-[38px]"
                  />
                  {keyword && (
                    <button 
                      type="button" 
                      onClick={() => { setKeyword(''); setPageNum(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-0"
                    >
                      <i className="fas fa-times-circle"></i>
                    </button>
                  )}
                </div>
                <button type="submit" className="hidden">Search</button>
              </form>

              <button 
                type="button"
                onClick={handleSearchSubmit}
                className="w-full sm:w-auto px-5 h-[38px] rounded-[10px] font-bold text-sm bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fas fa-search"></i> Cari
              </button>

              <button 
                type="button" 
                className="text-xs font-bold text-gray-500 hover:text-[#FF6B00] flex items-center gap-1 h-[38px] px-2 cursor-pointer"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <i className={`fas ${showAdvanced ? 'fa-chevron-up' : 'fa-sliders-h'}`}></i>
                {showAdvanced ? 'Hide' : 'Advanced'}
              </button>
            </div>
          </div>

          {/* Advanced options */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex gap-2 items-center">
                <span className="text-xs font-semibold text-gray-500 shrink-0">Price range:</span>
                <input type="number" placeholder="Min" className="w-full px-3 py-1.5 border border-gray-200 rounded-[8px] text-xs outline-none focus:border-[#FF6B00] bg-gray-50" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                <span className="text-gray-300">—</span>
                <input type="number" placeholder="Max" className="w-full px-3 py-1.5 border border-gray-200 rounded-[8px] text-xs outline-none focus:border-[#FF6B00] bg-gray-50" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs font-semibold text-gray-500 shrink-0">Sort By:</span>
                <select className="w-full px-3 py-1.5 border border-gray-200 rounded-[8px] text-xs outline-none focus:border-[#FF6B00] bg-gray-50 cursor-pointer" value={searchType} onChange={e => setSearchType(e.target.value)}>
                  <option value="0">Best Match</option>
                  <option value="1">Newest</option>
                  <option value="2">Trending</option>
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs font-semibold text-gray-500 shrink-0">Warehouse:</span>
                <select className="w-full px-3 py-1.5 border border-gray-200 rounded-[8px] text-xs outline-none focus:border-[#FF6B00] bg-gray-50 cursor-pointer" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                  <option value="">Any Warehouse</option>
                  <option value="US">🇺🇸 US</option>
                  <option value="CN">🇨🇳 China</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="m-5 p-3 bg-amber-50 border border-amber-200 rounded-[8px] text-amber-800 text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-amber-500"></i> {error}
          </div>
        )}

        {/* TABLE */}
        {loading && products.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><i className="fas fa-spinner fa-spin fa-2x"></i></div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 w-10">
                    <input 
                      type="checkbox" 
                      className="accent-[#FF6B00] w-4 h-4 cursor-pointer"
                      checked={products.length > 0 && selectedPids.size === products.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Category</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Cost</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Retail</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Hero</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any, idx: number) => {
                  const isImported = importedIds.has(p.pid);
                  const isImporting = importingId === p.pid;
                  const isHero = !!heroState[p.pid];
                  const cost = Number(p.sellPrice || 0);
                  const isSelected = selectedPids.has(p.pid);
                  
                  return (
                    <tr key={p.pid} className={`border-b border-gray-100 hover:bg-orange-50/30 transition-colors ${isSelected ? 'bg-orange-50' : isImported ? 'bg-green-50/40' : ''}`}>
                      <td className="px-5 py-3.5">
                        <input 
                          type="checkbox" 
                          className="accent-[#FF6B00] w-4 h-4 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(p.pid)}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.productImage || p.bigImage || '/placeholder.png'} 
                            alt="" 
                            className="w-10 h-10 rounded-[6px] object-cover border border-[#E2E8F0] shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                            onClick={() => setPreviewImage(p.productImage || p.bigImage || '/placeholder.png')}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1E293B] truncate max-w-[350px]" title={p.productNameEn || p.productName}>
                              {p.productNameEn || p.productName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">PID: {p.pid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded-full">{p.categoryName || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-700">{formatUSD(cost)}</td>
                      <td className="px-5 py-3.5 text-right font-black text-[#FF6B00]">{formatUSD(cost * 1.35)}</td>
                      <td className="px-5 py-3.5 text-center">
                        {!isImported && (
                          <input type="checkbox" className="accent-[#FF6B00] w-4 h-4 cursor-pointer" checked={isHero} onChange={e => setHeroState({...heroState, [p.pid]: e.target.checked})} disabled={isImporting} />
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {isImported ? (
                          <span className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[6px] text-[11px] font-bold bg-green-100 text-green-700 border border-green-200 w-full">
                            <i className="fas fa-check-circle"></i> Imported
                          </span>
                        ) : (
                          <button
                            className={`px-4 py-1.5 rounded-[6px] text-[11px] font-black flex items-center justify-center gap-1.5 transition-all w-full cursor-pointer ${
                              isHero ? 'bg-[#1E293B] text-white hover:bg-black' : 'bg-[#FF6B00] text-white hover:bg-[#E65100]'
                            }`}
                            onClick={() => handleImport(p)}
                            disabled={isImporting}
                          >
                            {isImporting ? <><i className="fas fa-spinner fa-spin"></i>...</> : <><i className="fas fa-cloud-download-alt"></i> Import</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : !loading ? (
          <div className="p-12 text-center">
            <i className="fas fa-box-open text-4xl text-gray-300 mb-3"></i>
            <p className="font-bold text-gray-700">No products found</p>
            <p className="text-gray-400 text-sm">Try different keywords or category</p>
          </div>
        ) : null}

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-white rounded-b-[16px] gap-4">
            <div className="text-sm font-semibold text-gray-500">
              Showing {totalRecords === 0 ? 0 : ((pageNum - 1) * pageSize) + 1} to {Math.min(pageNum * pageSize, totalRecords)} of {totalRecords} entries
            </div>
            <div className="flex gap-1.5 items-center flex-wrap">
              <button 
                className="px-3.5 py-1.5 rounded-[8px] text-xs font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                disabled={pageNum <= 1 || loading}
                onClick={() => setPageNum(prev => Math.max(1, prev - 1))}
              >
                <i className="fas fa-chevron-left"></i> Prev
              </button>
              
              {(() => {
                const pages = [];
                const maxVisiblePages = 8;
                let startPage = Math.max(1, pageNum - 3);
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      disabled={loading}
                      className={`px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-all duration-200 border cursor-pointer ${
                        pageNum === i
                          ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setPageNum(i)}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}
              
              <button 
                className="px-3.5 py-1.5 rounded-[8px] text-xs font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                disabled={pageNum >= totalPages || loading}
                onClick={() => setPageNum(prev => Math.min(totalPages, prev + 1))}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
          <button 
            type="button" 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border border-white/20"
            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
          >
            <i className="fas fa-times text-xl"></i>
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
