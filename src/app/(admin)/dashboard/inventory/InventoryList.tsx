'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { calculateFinalPrice } from '@/lib/pricing';
import { useSettings } from '@/context/SettingsContext';
import { slugify, parseProductName } from '@/lib/cj-utils';
import { getAdminCouponsAction } from '@/lib/actions-admin';
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

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  description: string | null;
  minPurchase: number | null;
  isActive: boolean;
  expiresAt: string | Date | null;
  usedCount: number;
  maxUses: number | null;
}

export default function InventoryList({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [editingPrice, setEditingPrice] = useState<{ variantId: string; value: string } | null>(null);
  const [couponModal, setCouponModal] = useState<{ show: boolean; productId: string | null; isBulk: boolean }>({ show: false, productId: null, isBulk: false });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const { settings } = useSettings();

  // Fetch available coupons when modal opens
  useEffect(() => {
    if (couponModal.show && coupons.length === 0) {
      getAdminCouponsAction()
        .then(data => {
          if (data.success) {
            // Filter active & not expired
            const now = new Date();
            const active = (data.data || []).filter((c: Coupon) =>
              c.isActive && (!c.expiresAt || new Date(c.expiresAt) > now)
            );
            setCoupons(active);
          }
        })
        .catch(err => console.error('Failed to fetch coupons:', err));
    }
  }, [couponModal.show, coupons.length]);

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
  const [cjStockLoading, setCjStockLoading] = useState<Record<string, boolean>>({});

  const fetchCjStock = async (variantCjId: string) => {
    if (cjStocks[variantCjId]) return; // already fetched
    setCjStockLoading(prev => ({ ...prev, [variantCjId]: true }));
    try {
      const res = await fetch(`/api/cj-proxy?endpoint=/api2.0/v1/product/stock/queryByVid?vid=${variantCjId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const total = data.data.reduce((sum: number, w: any) => sum + (w.totalInventoryNum || 0), 0);
        setCjStocks(prev => ({ ...prev, [variantCjId]: { total, warehouses: data.data } }));
      }
    } catch (err) {
      console.error('Failed to fetch CJ stock:', err);
    } finally {
      setCjStockLoading(prev => ({ ...prev, [variantCjId]: false }));
    }
  };

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

  // ── Export with coupon ──────────────────────────────────────────────────
  const handleExportWithCoupon = async () => {
    const { productId, isBulk } = couponModal;
    setCouponModal({ show: false, productId: null, isBulk: false });

    if (isBulk) {
      setLoading('bulk-export');
      let success = 0;
      let skipped = 0;
      let errors = 0;
      for (const p of products) {
        try {
          const data = await exportToBlogAction(p.id, selectedCouponId);
          if (data.success) success++;
          else if (data.status === 409) skipped++;
          else errors++;
        } catch {
          errors++;
        }
      }
      setLoading(null);
      showToast(`✅ ${success} exported, ${skipped} skipped, ${errors} errors`);
    } else if (productId) {
      setLoading(`blog-${productId}`);
      try {
        const data = await exportToBlogAction(productId, selectedCouponId);
        if (data.success) {
          showToast('✅ Blog post created!');
        } else {
          showToast(data.error || 'Export failed', 'error');
        }
      } catch (err) {
        showToast('Export error', 'error');
      } finally {
        setLoading(null);
      }
    }
  };

  // Format coupon label for display
  const formatCouponLabel = (c: Coupon): string => {
    if (c.type === 'PERCENTAGE') return `${c.value}% OFF`;
    if (c.type === 'FIXED') return `$${c.value} OFF`;
    if (c.type === 'FREE_SHIPPING') return 'FREE SHIPPING';
    return c.code;
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

      {/* Bulk Export All Button */}
      {products.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span className="text-sm text-gray-500 font-medium">
            {products.length} products
          </span>
          <button
            onClick={() => {
              setSelectedCouponId(null);
              setCouponModal({ show: true, productId: null, isBulk: true });
            }}
            disabled={loading === 'bulk-export'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
          >
            <i className={`fas ${loading === 'bulk-export' ? 'fa-spinner fa-spin' : 'fa-blog'}`}></i>
            {loading === 'bulk-export' ? 'Exporting...' : '📝 Export All to Blog'}
          </button>
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
                          <div className="font-extrabold truncate max-w-[360px] text-gray-800">
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
                        <button 
                          className="px-2.5 py-1.5 rounded-[8px] text-sm border border-gray-200 text-green-600 hover:bg-green-50 transition-all duration-200"
                          title="Export to Blog"
                          disabled={loading === `blog-${p.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCouponId(null);
                            setCouponModal({ show: true, productId: p.id, isBulk: false });
                          }}
                        >
                          <i className={`fas fa-blog ${loading === `blog-${p.id}` ? 'fa-spin' : ''}`}></i>
                        </button>
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
                                  const cjLoading = cjStockLoading[v.cjId];
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
                                          <span
                                            className="inline-block px-2.5 py-1 rounded-[6px] text-[13px] font-black bg-green-100 text-green-700 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingPrice({ variantId: v.id, value: String(v.sellingPrice) });
                                            }}
                                            title="Click to edit price"
                                          >
                                            ${calculateFinalPrice(v.sellingPrice, settings).toFixed(2)}
                                          </span>
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

      {/* ── Coupon Selection Modal ──────────────────────────────────────── */}
      {couponModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-800">Select Coupon</h3>
              <p className="text-sm text-gray-500 mt-1">Choose a coupon to attach to the blog post (optional)</p>
            </div>
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {/* No Coupon option */}
              <button
                onClick={() => {
                  setSelectedCouponId(null);
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-[12px] border-2 transition-all duration-200 text-left ${
                  selectedCouponId === null
                    ? 'border-[#FF6B00] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">🚫</span>
                <div>
                  <div className="font-extrabold text-gray-800">No Coupon</div>
                  <div className="text-xs text-gray-500">Generate blog without any coupon offer</div>
                </div>
              </button>

              {/* Coupon list */}
              {coupons.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No active coupons available.{' '}
                  <a href="/dashboard/coupon" className="text-[#FF6B00] font-bold hover:underline">
                    Create one
                  </a>
                </div>
              ) : (
                coupons.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCouponId(c.id);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-[12px] border-2 transition-all duration-200 text-left ${
                      selectedCouponId === c.id
                        ? 'border-[#FF6B00] bg-orange-50'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-2xl">
                      {c.type === 'FREE_SHIPPING' ? '🚚' : c.type === 'PERCENTAGE' ? '🏷️' : '💰'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-800">{c.code}</span>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                          {formatCouponLabel(c)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {c.description || formatCouponLabel(c)}
                        {c.minPurchase ? ` • Min $${c.minPurchase}` : ''}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setCouponModal({ show: false, productId: null, isBulk: false })}
                className="px-5 py-2 rounded-[10px] text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleExportWithCoupon}
                className="px-6 py-2.5 rounded-[10px] text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all duration-200"
              >
                Generate Blog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
