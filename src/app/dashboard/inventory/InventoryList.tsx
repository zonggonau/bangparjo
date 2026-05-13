'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { calculateFinalPrice } from '@/lib/pricing';
import { useSettings } from '@/context/SettingsContext';
import { 
  ChevronRight, 
  RefreshCw, 
  Trash2, 
  Star, 
  Layers, 
  Box, 
  AlertTriangle,
  ExternalLink,
  Loader2,
  X,
  Database,
  Image as ImageIcon
} from 'lucide-react';

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

export default function InventoryList({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const { settings } = useSettings();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSync = async (e: React.MouseEvent, productId: string, cjId: string) => {
    e.stopPropagation();
    setLoading(`sync-${productId}`);
    try {
      const res = await fetch('/api/admin/inventory/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: cjId }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map(p => p.id === productId ? { ...p, variants: data.variants } : p));
        alert('Local state synchronized with CJ Network.');
      } else {
        alert('Synchronization failure: ' + data.error);
      }
    } catch (err) { alert('Critical error during synchronization.'); } 
    finally { setLoading(null); }
  };

  const handleToggleHero = async (productId: string, currentStatus: boolean) => {
    setLoading(`hero-${productId}`);
    try {
      const res = await fetch('/api/admin/inventory/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, isHero: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map(p => p.id === productId ? { ...p, isHero: data.product.isHero } : p));
      } else { alert('Failed to update promotion status.'); }
    } catch (err) { alert('Critical error during promotion update.'); } 
    finally { setLoading(null); }
  };

  const handleDelete = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!confirm('Execute permanent deletion of this asset from local storage?')) return;
    setLoading(`delete-${productId}`);
    try {
      const res = await fetch(`/api/admin/inventory/delete?id=${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter(p => p.id !== productId));
        alert('Asset purged from local database.');
      } else { alert('Deletion failure: ' + (data.error || 'Unknown error')); }
    } catch (err: any) { alert('Critical error during deletion sequence.'); } 
    finally { setLoading(null); }
  };

  const handleDeleteVariant = async (e: React.MouseEvent, productId: string, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Purge this specific variant from local storage?')) return;
    setLoading(`delete-variant-${variantId}`);
    try {
      const res = await fetch(`/api/admin/inventory/delete?variantId=${variantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map(p => {
          if (p.id === productId) {
            return { ...p, variants: p.variants.filter(v => v.id !== variantId) };
          }
          return p;
        }));
        alert('Variant pruned.');
      } else { alert('Pruning failure: ' + data.error); }
    } catch (err: any) { alert('Critical error during pruning sequence.'); } 
    finally { setLoading(null); }
  };

  return (
    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
      {products.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-center px-12">
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 mb-8">
            <Database size={40} />
          </div>
          <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Vault Is Empty</h4>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Import global assets via the Importer Terminal.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Asset Information</th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Structure</th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Global Stock</th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map(p => {
                const totalStock = p.variants.reduce((acc, v) => acc + v.inventory, 0);
                const isExpanded = expandedId === p.id;
                
                return (
                  <React.Fragment key={p.id}>
                    <tr className={`group transition-all ${isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={(e) => { e.preventDefault(); toggleExpand(p.id); }}
                            className={`w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all ${isExpanded ? 'rotate-90 text-primary border-primary/20' : ''}`}
                          >
                            <ChevronRight size={16} />
                          </button>
                          
                          <div className="w-16 h-16 relative rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 group-hover:ring-primary/20 transition-all">
                            <Image src={p.images[0] || '/placeholder.png'} alt={p.name} fill className="object-cover" unoptimized />
                          </div>
                          
                          <div className="flex flex-col gap-1 max-w-md">
                            <h4 className="text-xs font-black text-white uppercase italic tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h4>
                            <div className="flex items-center gap-4">
                               <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">CJ-NET: {p.cjId}</span>
                               <button
                                 onClick={(e) => { e.stopPropagation(); handleToggleHero(p.id, p.isHero); }}
                                 disabled={loading === `hero-${p.id}`}
                                 className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${p.isHero ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'bg-white/5 text-white/20 border border-white/5 hover:text-white'}`}
                               >
                                 {loading === `hero-${p.id}` ? <Loader2 size={10} className="animate-spin" /> : <Star size={10} className={p.isHero ? 'fill-primary' : ''} />}
                                 {p.isHero ? 'Promoted' : 'Promote'}
                               </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                            <Layers size={10} /> {p.variants.length} Variants
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                         <div className="flex flex-col gap-1">
                           <span className={`text-sm font-black italic tracking-tight ${totalStock < 50 ? 'text-red-400 text-glow-red' : 'text-white'}`}>
                             {totalStock.toLocaleString()} UNITS
                           </span>
                           <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                             <div 
                               className={`h-full transition-all duration-1000 ${totalStock < 50 ? 'bg-red-500' : 'bg-primary'}`} 
                               style={{ width: `${Math.min(100, (totalStock / 500) * 100)}%` }} 
                             />
                           </div>
                         </div>
                      </td>
                      
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={(e) => handleSync(e, p.id, p.cjId)}
                            disabled={loading === `sync-${p.id}`}
                            className="px-4 py-2 bg-white/5 border border-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {loading === `sync-${p.id}` ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Sync
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, p.id)}
                            disabled={loading === `delete-${p.id}`}
                            className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-black transition-all active:scale-95 disabled:opacity-50"
                          >
                            {loading === `delete-${p.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-black/40">
                        <td colSpan={4} className="p-0">
                          <div className="px-12 py-8 animate-in slide-in-from-top-2 duration-300">
                            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-white/5">
                                    <th className="px-6 py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Variant Configuration</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Terminal Cost</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Retail Logic</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Inventory</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Prune</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {p.variants.map(v => (
                                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                          {v.image ? (
                                            <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-black border border-white/10">
                                              <img 
                                                src={v.image} alt={v.color || ''} 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => (e.currentTarget.src = '/placeholder.png')}
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/10">
                                              <ImageIcon size={14} />
                                            </div>
                                          )}
                                          <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-white uppercase italic tracking-tight">{v.color} {v.size}</span>
                                            <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">{v.sku}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className="text-xs font-black text-white/40 italic tracking-tight">${v.baseCost.toFixed(2)}</span>
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className="text-xs font-black text-primary italic tracking-tight text-glow">
                                          ${calculateFinalPrice(v.sellingPrice, settings).toFixed(2)}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                           <span className={`text-xs font-black italic tracking-tight ${v.inventory < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                             {v.inventory}
                                           </span>
                                           {v.inventory < 10 && <AlertTriangle size={10} className="text-red-500" />}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <button 
                                          onClick={(e) => handleDeleteVariant(e, p.id, v.id)}
                                          disabled={loading === `delete-variant-${v.id}`}
                                          className="w-8 h-8 rounded-lg bg-white/5 text-white/20 hover:bg-red-500 hover:text-black transition-all flex items-center justify-center disabled:opacity-50"
                                        >
                                          {loading === `delete-variant-${v.id}` ? <Loader2 size={12} className="animate-spin" /> : <X size={14} />}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

