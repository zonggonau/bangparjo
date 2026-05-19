'use client';

import { useState } from 'react';
import Image from 'next/image';
import { parseProductImage } from '@/lib/utils';

export default function ProductImporter() {
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  
  // Manual Import State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    setResults([]);
    try {
      let finalQuery = query.trim();
      const urlMatch = finalQuery.match(/-p-(\d+)\.html/);
      const extractedPid = urlMatch ? urlMatch[1] : null;
      if (extractedPid || /^\d{15,}$/.test(finalQuery)) {
        const pid = extractedPid || finalQuery;
        const res = await fetch(`/api/cj-proxy?endpoint=/v1/product/query?pid=${pid}`);
        const data = await res.json();
        if (data.success && data.data) {
          const p = data.data;
          setResults([{
            pid: p.pid || p.id || pid,
            productNameEn: p.productNameEn || p.nameEn || 'No Title',
            productImage: parseProductImage(p.productImage || p.bigImage || p.productImageSet),
            productSku: p.productSku || p.sku || 'No SKU',
            sellPrice: p.sellPrice || p.variantSellPrice || 0,
            categoryName: p.categoryName || p.threeCategoryName || 'Product'
          }]);
          return;
        }
      }
      const isSku = finalQuery.toUpperCase().startsWith('CJ') || /^[a-zA-Z0-9-]{8,}$/.test(finalQuery);
      const param = isSku ? 'productSku' : 'productNameEn';
      const res = await fetch(`/api/cj-proxy?endpoint=/v1/product/list?${param}=${encodeURIComponent(finalQuery)}&pageSize=20`);
      const data = await res.json();
      if (data.success && data.data) {
        const list = (data.data.list || []).map((p: any) => ({
          pid: p.pid || p.id,
          productNameEn: p.productNameEn || p.nameEn,
          productImage: parseProductImage(p.productImage || p.bigImage),
          productSku: p.productSku || p.sku,
          sellPrice: p.sellPrice,
          categoryName: p.categoryName || 'Product'
        }));
        setResults(list);
        if (list.length === 0) showToast('No products found matching your search', 'error');
      }
    } catch (err) { console.error(err); showToast('CJ network error', 'error'); } 
    finally { setSearching(false); }
  };

  const handleImport = async (pid: string) => {
    setImporting(pid);
    try {
      const res = await fetch('/api/admin/import-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, isHero: false })
      });
      const data = await res.json();
      if (data.success) showToast('Product imported to inventory');
      else showToast(data.error || 'Import failure', 'error');
    } catch (err: any) { showToast('Server crash during import', 'error'); } 
    finally { setImporting(null); }
  };

  // ── My Product (Add to CJ My Product) ────────────────────────────────────
  const [myProductLoading, setMyProductLoading] = useState<string | null>(null);

  const handleAddToMyProduct = async (pid: string) => {
    setMyProductLoading(pid);
    try {
      const res = await fetch('/api/cj-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api2.0/v1/product/addToMyProduct',
          method: 'POST',
          data: { pid }
        })
      });
      const data = await res.json();
      if (data.success || data.result) showToast('Added to CJ My Products');
      else showToast(data.message || 'Failed to add', 'error');
    } catch (err) { showToast('Error adding to My Products', 'error'); }
    finally { setMyProductLoading(null); }
  };

  // ── Sourcing ─────────────────────────────────────────────────────────────
  const [sourcingLoading, setSourcingLoading] = useState<string | null>(null);
  const [sourcingModal, setSourcingModal] = useState<{ pid: string; name: string; image: string } | null>(null);
  const [sourcingUrl, setSourcingUrl] = useState('');
  const [sourcingPrice, setSourcingPrice] = useState('');

  const handleCreateSourcing = async () => {
    if (!sourcingModal) return;
    setSourcingLoading(sourcingModal.pid);
    try {
      const res = await fetch('/api/cj-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api2.0/v1/product/sourcing/create',
          method: 'POST',
          data: {
            productName: sourcingModal.name,
            productImage: sourcingModal.image,
            productUrl: sourcingUrl || undefined,
            price: sourcingPrice ? parseFloat(sourcingPrice) : undefined,
          }
        })
      });
      const data = await res.json();
      if (data.success || data.result) {
        showToast('Sourcing request created!');
        setSourcingModal(null);
        setSourcingUrl('');
        setSourcingPrice('');
      } else showToast(data.message || 'Sourcing failed', 'error');
    } catch (err) { showToast('Error creating sourcing', 'error'); }
    finally { setSourcingLoading(null); }
  };

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg transition-all duration-300 ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
          {toast.message}
        </div>
      )}

      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Product Importer</h2>
        <p className="text-[#64748B] font-semibold">Search and sync global products directly from CJ Dropshipping.</p>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-8 mb-10 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <i className="fas fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"></i>
            <input 
              type="text" 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              placeholder="Paste CJ URL, SKU, or Product Name..." 
              className="w-full py-4 pl-12 pr-4 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] text-[15px] outline-none font-semibold focus:border-[#FF6B00] focus:shadow-[0_0_0_4px_#FFF3E0] focus:bg-white transition-all duration-200"
            />
          </div>
          <button className="inline-flex items-center gap-2.5 px-8 py-4 rounded-[12px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200" type="submit" disabled={searching}>
            {searching ? <i className="fas fa-spinner fa-spin"></i> : 'Fetch Products'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map(p => (
          <div key={p.pid} className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200">
            <div className="relative h-[220px] overflow-hidden">
              <Image src={p.productImage} alt="" fill className="object-cover" unoptimized />
            </div>
            <div className="p-5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold bg-[#DBEAFE] text-[#1E40AF] mb-2.5">{p.productSku}</span>
              <h4 className="text-[14px] font-extrabold mb-4 h-10 overflow-hidden text-[#1E293B] leading-[1.4]">{p.productNameEn}</h4>
              <div className="flex justify-between items-center pt-4 border-t border-[#F1F5F9]">
                <span className="font-black text-lg text-[#FF6B00]">${p.sellPrice}</span>
                <div className="flex gap-1.5">
                  <button 
                    className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-[8px] text-xs font-bold border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200"
                    title="Add to CJ My Products"
                    onClick={() => handleAddToMyProduct(p.pid)}
                    disabled={myProductLoading === p.pid}
                  >
                    {myProductLoading === p.pid ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-heart"></i>}
                  </button>
                  <button 
                    className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-[8px] text-xs font-bold border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200"
                    title="Request Sourcing"
                    onClick={() => setSourcingModal({ pid: p.pid, name: p.productNameEn, image: p.productImage })}
                  >
                    <i className="fas fa-search-plus"></i>
                  </button>
                  <button 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200"
                    onClick={() => handleImport(p.pid)}
                    disabled={importing === p.pid}
                  >
                    {importing === p.pid ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-download"></i> Import</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !searching && (
        <div className="text-center py-[100px] text-[#94A3B8]">
          <div className="text-[64px] opacity-20 mb-6">
            <i className="fas fa-search-plus"></i>
          </div>
          <h3 className="text-lg font-extrabold text-[#64748B] mb-2">Ready to grow your catalog?</h3>
          <p className="max-w-[400px] mx-auto">Search the CJ global network using product titles, SKUs, or direct URLs to import best-sellers instantly.</p>
        </div>
      )}

      {/* Sourcing Modal */}
      {sourcingModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-5" onClick={() => setSourcingModal(null)}>
          <div className="bg-white rounded-[16px] p-8 max-w-[480px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.3)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black m-0 text-[#1E293B]">Request Sourcing</h3>
              <button className="inline-flex items-center justify-center p-1 rounded-[8px] text-lg border-none bg-transparent text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" onClick={() => setSourcingModal(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex gap-4 mb-6 p-4 bg-[#F8FAFC] rounded-[12px]">
              <Image src={sourcingModal.image} alt="" width={80} height={80} className="rounded-[8px] object-cover" unoptimized />
              <div>
                <div className="font-extrabold text-sm mb-1 text-[#1E293B]">{sourcingModal.name}</div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold bg-[#DBEAFE] text-[#1E40AF]">PID: {sourcingModal.pid}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[13px] font-bold mb-1.5 text-[#475569]">Product URL (optional)</label>
              <input
                type="text"
                value={sourcingUrl}
                onChange={e => setSourcingUrl(e.target.value)}
                placeholder="https://example.com/product/..."
                className="w-full px-4 py-3 rounded-[10px] border border-[#E2E8F0] text-sm outline-none font-semibold focus:border-[#FF6B00] focus:shadow-[0_0_0_4px_#FFF3E0] focus:bg-white transition-all duration-200 box-border"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[13px] font-bold mb-1.5 text-[#475569]">Target Price (USD, optional)</label>
              <input
                type="number"
                step="0.01"
                value={sourcingPrice}
                onChange={e => setSourcingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-[10px] border border-[#E2E8F0] text-sm outline-none font-semibold focus:border-[#FF6B00] focus:shadow-[0_0_0_4px_#FFF3E0] focus:bg-white transition-all duration-200 box-border"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white text-[#1E293B] hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200" onClick={() => setSourcingModal(null)}>
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[12px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200"
                onClick={handleCreateSourcing}
                disabled={sourcingLoading === sourcingModal.pid}
              >
                {sourcingLoading === sourcingModal.pid ? (
                  <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                ) : (
                  <><i className="fas fa-paper-plane"></i> Submit Sourcing Request</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
