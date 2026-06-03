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
  const [pageSize] = useState(50);

  // Mega Menu state
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [activeL1, setActiveL1] = useState<CategoryNode | null>(categoryTree[0] || null);
  const [activeL2, setActiveL2] = useState<CategoryNode | null>(null);

  useEffect(() => {
    if (categoryTree.length > 0 && !activeL1) {
      setActiveL1(categoryTree[0]);
    }
  }, [categoryTree]);

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

  const selectCategory = (id: string, name: string) => {
    setSelectedCategory(id);
    setSelectedCategoryName(name);
    setPageNum(1);
    setShowMegaMenu(false);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  const inputClass = "px-3 py-2 rounded-[6px] border border-[#E2E8F0] bg-gray-50 text-sm outline-none focus:border-[#FF6B00] focus:bg-white transition-all duration-200";
  const btnClass = "px-4 py-2 rounded-[6px] font-bold text-sm bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200 flex items-center justify-center gap-2";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1E293B]">CJ Catalog Finder</h2>
          <p className="text-[#64748B] text-sm">Browse & import products one by one</p>
        </div>
        <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] no-underline">
          <i className="fas fa-boxes text-[#FF6B00]"></i> Inventory
        </Link>
      </div>

      {/* Filter Panel */}
      <form onSubmit={handleSearchSubmit} className="bg-white rounded-[12px] border border-[#E2E8F0] p-4 grid grid-cols-1 md:grid-cols-[240px_1fr_120px] gap-3 items-end">
        {/* Category */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-[10px] font-bold text-[#64748B] uppercase">Category</label>
          <button type="button" className={inputClass + " w-full text-left flex items-center justify-between cursor-pointer"} onClick={() => setShowMegaMenu(!showMegaMenu)}>
            <span className="truncate text-sm">{selectedCategoryName}</span>
            <i className={`fas fa-chevron-down text-gray-400 text-[10px] transition-transform ${showMegaMenu ? 'rotate-180' : ''}`}></i>
          </button>

          {showMegaMenu && (
            <>
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowMegaMenu(false)} />
              <div className="absolute top-full left-0 w-[700px] bg-white border border-[#E2E8F0] rounded-[12px] shadow-xl p-4 z-50 grid grid-cols-3 gap-3 max-h-[450px] overflow-y-auto">
                <div className="border-r border-[#F1F5F9] pr-2">
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-2">Main</p>
                  <button type="button" className={`block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold mb-0.5 ${!selectedCategory ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => selectCategory('', 'All Categories')}>🌟 All</button>
                  {categoryTree.map(l1 => (
                    <button key={l1.id} type="button" className={`block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold mb-0.5 ${activeL1?.id === l1.id ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => { setActiveL1(l1); setActiveL2(null); }}>
                      {l1.name}
                    </button>
                  ))}
                </div>
                <div className="border-r border-[#F1F5F9] px-2">
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-2">Sub</p>
                  {activeL1 && <button type="button" className="block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold text-gray-500 bg-gray-50 mb-1 hover:bg-orange-50 hover:text-[#FF6B00]" onClick={() => selectCategory(activeL1.id, `All ${activeL1.name}`)}>🎯 All {activeL1.name}</button>}
                  {activeL1?.children?.map(l2 => (
                    <button key={l2.id} type="button" className={`block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold mb-0.5 ${activeL2?.id === l2.id ? 'bg-orange-50 text-[#FF6B00]' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => setActiveL2(l2)}>{l2.name}</button>
                  ))}
                </div>
                <div className="pl-2">
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-2">Detail</p>
                  {activeL2 && <button type="button" className="block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold text-gray-500 bg-gray-50 mb-1 hover:bg-orange-50 hover:text-[#FF6B00]" onClick={() => selectCategory(activeL2.id, activeL2.name)}>🎯 All {activeL2.name}</button>}
                  {activeL2?.children?.map(l3 => (
                    <button key={l3.id} type="button" className="block w-full text-left px-2 py-1.5 rounded-[6px] text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-[#FF6B00]" onClick={() => selectCategory(l3.id, l3.name)}>{l3.name}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#64748B] uppercase">Keyword</label>
          <input type="text" className={inputClass + " w-full"} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search..." />
        </div>

        <button type="submit" className={btnClass + " h-[38px]"}><i className="fas fa-search"></i> Cari</button>

        <div className="col-span-1 md:col-span-3 flex justify-end">
          <button type="button" className="text-xs font-bold text-gray-400 hover:text-[#FF6B00] flex items-center gap-1" onClick={() => setShowAdvanced(!showAdvanced)}>
            <i className={`fas ${showAdvanced ? 'fa-chevron-up' : 'fa-sliders-h'}`}></i>
            {showAdvanced ? 'Hide' : 'Advanced'}
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-3 gap-3 col-span-1 md:col-span-3 pt-3 border-t border-[#F1F5F9]">
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-500">Price:</span>
              <input type="number" placeholder="Min" className={inputClass + " w-full h-[34px] text-xs"} value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              <span className="text-gray-300">—</span>
              <input type="number" placeholder="Max" className={inputClass + " w-full h-[34px] text-xs"} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
            <select className={inputClass + " h-[34px] text-xs"} value={searchType} onChange={e => setSearchType(e.target.value)}>
              <option value="0">Best Match</option>
              <option value="1">Newest</option>
              <option value="2">Trending</option>
            </select>
            <select className={inputClass + " h-[34px] text-xs"} value={countryCode} onChange={e => setCountryCode(e.target.value)}>
              <option value="">Any Warehouse</option>
              <option value="US">🇺🇸 US</option>
              <option value="CN">🇨🇳 China</option>
            </select>
          </div>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-[8px] text-amber-800 text-sm font-semibold flex items-center gap-2">
          <i className="fas fa-exclamation-triangle text-amber-500"></i> {error}
        </div>
      )}

      {/* TABLE */}
      {loading && products.length === 0 ? (
        <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin fa-2x"></i></div>
      ) : products.length > 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] overflow-x-auto shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-gray-50">
                <th className="text-left px-4 py-3 text-[10px] font-black text-[#64748B] uppercase tracking-wider w-10">#</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-[#64748B] uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-[#64748B] uppercase tracking-wider w-24">Category</th>
                <th className="text-right px-4 py-3 text-[10px] font-black text-[#64748B] uppercase tracking-wider w-20">Cost</th>
                <th className="text-right px-4 py-3 text-[10px] font-black text-[#64748B] uppercase tracking-wider w-20">Retail</th>
                <th className="text-center px-4 py-3 text-[10px] font-black text-[#64748B] uppercase tracking-wider w-16">Hero</th>
                <th className="text-center px-4 py-3 text-[10px] font-black text-[#64748B] uppercase tracking-wider w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any, idx: number) => {
                const isImported = importedIds.has(p.pid);
                const isImporting = importingId === p.pid;
                const isHero = !!heroState[p.pid];
                const cost = Number(p.sellPrice || 0);
                
                return (
                  <tr key={p.pid} className={`border-b border-[#F1F5F9] hover:bg-orange-50/30 transition-colors ${isImported ? 'bg-green-50/40' : ''}`}>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{(pageNum - 1) * pageSize + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.productImage || p.bigImage || '/placeholder.png'} alt="" className="w-10 h-10 rounded-[6px] object-cover border border-[#E2E8F0] shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1E293B] truncate max-w-[350px]" title={p.productNameEn || p.productName}>
                            {p.productNameEn || p.productName}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">PID: {p.pid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded-full">{p.categoryName || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-700">{formatUSD(cost)}</td>
                    <td className="px-4 py-3 text-right font-black text-[#FF6B00]">{formatUSD(cost * 1.35)}</td>
                    <td className="px-4 py-3 text-center">
                      {!isImported && (
                        <input type="checkbox" className="accent-[#FF6B00] w-4 h-4 cursor-pointer" checked={isHero} onChange={e => setHeroState({...heroState, [p.pid]: e.target.checked})} disabled={isImporting} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isImported ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-[11px] font-bold bg-green-100 text-green-700 border border-green-200">
                          <i className="fas fa-check-circle"></i> Imported
                        </span>
                      ) : (
                        <button
                          className={`px-4 py-1.5 rounded-[6px] text-[11px] font-black flex items-center justify-center gap-1.5 transition-all w-full ${
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
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-12 text-center">
          <i className="fas fa-box-open text-4xl text-gray-300 mb-3"></i>
          <p className="font-bold text-gray-700">No products found</p>
          <p className="text-gray-400 text-sm">Try different keywords or category</p>
        </div>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-[#E2E8F0]">
          <button className="px-3 py-1.5 rounded-[6px] text-xs font-bold border border-[#E2E8F0] text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={pageNum <= 1 || loading} onClick={() => setPageNum(prev => Math.max(1, prev - 1))}>
            <i className="fas fa-chevron-left mr-1"></i> Prev
          </button>
          <span className="text-sm font-bold text-[#64748B]">Page {pageNum} of {totalPages} <span className="text-xs text-gray-400 font-normal">({totalRecords.toLocaleString()} products)</span></span>
          <button className="px-3 py-1.5 rounded-[6px] text-xs font-bold border border-[#E2E8F0] text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={pageNum >= totalPages || loading} onClick={() => setPageNum(prev => Math.min(totalPages, prev + 1))}>
            Next <i className="fas fa-chevron-right ml-1"></i>
          </button>
        </div>
      )}
    </div>
  );
}
