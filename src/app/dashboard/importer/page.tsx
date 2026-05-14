'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Zap, 
  Database, 
  Globe, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ProductImporter() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  
  // Manual Import State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  // Bulk Import State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [syncLimit, setSyncLimit] = useState(100);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetch('/api/cj-proxy?endpoint=/v1/product/getCategory')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const list = Array.isArray(data.data) ? data.data : (data.data.categoryList || data.data.list || []);
          setCategories(list);
        }
      });
  }, []);

  useEffect(() => {
    let interval: any;
    if (isSyncing) {
      interval = setInterval(async () => {
        const res = await fetch('/api/admin/sync/status');
        const data = await res.json();
        if (data.success) {
          setSyncStatus(data.data);
          if (data.data.status === 'COMPLETED' || data.data.status === 'FAILED') {
            setIsSyncing(false);
            clearInterval(interval);
          }
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSyncing]);

  const handleStartSync = async () => {
    if (!selectedCat) return alert('Please select a target category cluster.');
    setIsSyncing(true);
    setSyncStatus({ status: 'RUNNING', processed: 0, total: 0, message: 'Initializing sequence...' });
    try {
      const res = await fetch('/api/admin/sync/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedCat, limit: syncLimit })
      });
      const data = await res.json();
      if (!data.success) {
        alert('Sequence failure: ' + data.message);
        setIsSyncing(false);
      }
    } catch (err) { setIsSyncing(false); }
  };

  const parseImg = (img: any): string => {
    if (!img) return '/placeholder.png';
    if (typeof img === 'string') {
      const trimmed = img.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) return parseImg(parsed[0]);
        } catch (e) { }
      }
      if (trimmed.startsWith('//')) return `https:${trimmed}`;
      return trimmed;
    }
    if (Array.isArray(img) && img.length > 0) return parseImg(img[0]);
    return '/placeholder.png';
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
            productImage: parseImg(p.productImage || p.bigImage || p.productImageSet),
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
          productImage: parseImg(p.productImage || p.bigImage),
          productSku: p.productSku || p.sku,
          sellPrice: p.sellPrice,
          categoryName: p.categoryName || 'Product'
        }));
        setResults(list);
      }
    } catch (err) { console.error(err); } 
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
      if (data.success) alert('Asset imported into local vault.');
      else alert('Import failure: ' + data.error);
    } catch (err: any) { alert('Critical error: ' + err.message); } 
    finally { setImporting(null); }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">Importer Terminal</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Interfacing with global product clusters for local deployment.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 border border-white/5 p-1.5 rounded-2xl flex items-center gap-1 w-fit">
        <button 
          onClick={() => setActiveTab('manual')}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'manual' ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
        >
          <Search size={14} /> Manual Search
        </button>
        <button 
          onClick={() => setActiveTab('bulk')}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'bulk' ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
        >
          <Zap size={14} /> Bulk Deployment
        </button>
      </div>

      {activeTab === 'manual' ? (
        <div className="space-y-12">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative group max-w-3xl">
            <div className="absolute inset-y-0 left-6 flex items-center text-white/20 group-focus-within:text-primary transition-colors">
              <Globe size={20} />
            </div>
            <input 
              type="text" 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by Title, SKU, or CJ Product URL..."
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-40 py-6 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-all backdrop-blur-xl"
            />
            <button 
              type="submit" 
              disabled={searching} 
              className="absolute right-3 top-3 bottom-3 px-8 bg-primary text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 
              {searching ? 'Querying...' : 'Fetch Assets'}
            </button>
          </form>

          {/* Results Grid */}
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {results.map(p => (
                <div key={p.pid} className="group bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl hover:border-primary/20 transition-all flex flex-col">
                  <div className="relative aspect-square overflow-hidden bg-black">
                    <Image 
                      src={p.productImage} 
                      alt={p.productNameEn || 'Product'} 
                      fill 
                      unoptimized
                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="p-8 flex flex-col flex-1 gap-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-white/20 uppercase tracking-widest">ID: {p.pid}</span>
                      <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest">SKU: {p.productSku}</span>
                    </div>
                    
                    <h3 className="text-xs font-black text-white uppercase italic tracking-tight line-clamp-2 leading-relaxed">
                      {p.productNameEn}
                    </h3>
                    
                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                       <div className="flex flex-col">
                         <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Cost Estimate</span>
                         <span className="text-sm font-black text-white italic tracking-tight">${p.sellPrice || 0}</span>
                       </div>
                       <button 
                         onClick={() => handleImport(p.pid)}
                         disabled={importing === p.pid}
                         className="flex-1 px-4 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {importing === p.pid ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                         {importing === p.pid ? 'Securing...' : 'Deploy'}
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !searching && (
            <div className="py-40 flex flex-col items-center justify-center text-center px-12 border-2 border-dashed border-white/5 rounded-[3rem]">
              <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 mb-8">
                <Globe size={40} />
              </div>
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Ready for Connection</h4>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] max-w-sm">Enter search parameters to scan the CJ global network.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-3xl">
          <div className="bg-white/5 border border-white/5 rounded-[3rem] p-12 md:p-16 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Zap size={160} className="text-primary" />
            </div>
            
            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Bulk Synchronization</h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Configure automated cluster injection protocols.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4">Target Category Cluster</label>
                  <select 
                    value={selectedCat} 
                    onChange={e => setSelectedCat(e.target.value)} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                  >
                    <option value="" className="bg-[#07070e]">Select Category...</option>
                    {categories.map((c, idx) => {
                      const id = c.categoryId || c.categoryFirstId || c.id;
                      const name = c.categoryFirstName || c.categoryNameEn || c.categoryName || c.name || `Cat: ${id}`;
                      return <option key={id || `cat-${idx}`} value={id} className="bg-[#07070e]">{name}</option>;
                    })}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4">Injection Limit</label>
                  <select 
                    value={syncLimit} 
                    onChange={e => setSyncLimit(Number(e.target.value))} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                  >
                    <option value="50" className="bg-[#07070e]">50 Payload Units</option>
                    <option value="100" className="bg-[#07070e]">100 Payload Units</option>
                    <option value="200" className="bg-[#07070e]">200 Payload Units</option>
                    <option value="500" className="bg-[#07070e]">500 Payload Units</option>
                  </select>
                </div>
              </div>

              {!isSyncing ? (
                <button 
                  onClick={handleStartSync} 
                  className="px-12 py-6 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                >
                  🚀 Initialize Bulk Deployment <ArrowRight size={18} />
                </button>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-10 space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 text-primary/20 animate-pulse">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Current Status</span>
                       <span className="text-xl font-black text-white uppercase italic tracking-tight">{syncStatus?.status}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Synchronization Delta</span>
                       <div className="text-xl font-black text-white italic tracking-tight">{syncStatus?.processed} <span className="text-white/20">/</span> {syncStatus?.total}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-700" 
                        style={{ width: `${(syncStatus?.processed / syncStatus?.total) * 100 || 0}%` }} 
                      />
                    </div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic">{syncStatus?.message}</p>
                  </div>
                </div>
              )}
              
              <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-5">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Protocol Intelligence</h5>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed italic">
                    Bulk deployment operates at throttled speeds to bypass network firewall constraints. You may safely detach this terminal; background processes will persist.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

