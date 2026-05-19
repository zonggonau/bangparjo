'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cj-proxy?endpoint=/api2.0/v1/product/myProduct/query?pageNum=${page}&pageSize=20`);
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data.list || []);
        setTotal(data.data.total || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleAddProduct = async () => {
    const pid = prompt('Enter CJ Product ID (PID) to add:');
    if (!pid) return;
    try {
      const res = await fetch('/api/cj-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api2.0/v1/product/addToMyProduct',
          method: 'POST',
          data: { pid },
        }),
      });
      const data = await res.json();
      if (data.success || data.result) {
        showToast('Product added to My Products!');
        fetchProducts();
      } else showToast(data.message || 'Failed to add product', 'error');
    } catch (e: any) { showToast('Error: ' + e.message, 'error'); }
  };

  return (
    <div className="animate-fade-in">
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i> {toast.message}
        </div>
      )}

      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">My Products</h2>
          <p className="text-[#64748B] font-semibold">Products added to your CJ collection ({total})</p>
        </div>
        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200" onClick={handleAddProduct}>
          <i className="fas fa-plus"></i> Add Product
        </button>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Product</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">PID</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Price</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Listed</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Added</th>
                <th className="text-right px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-[100px]"><i className="fas fa-circle-notch fa-spin fa-2x text-[#FF6B00]"></i></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-[100px] text-[#64748B]">
                  <div className="text-[48px] opacity-10 mb-4"><i className="fas fa-box-open"></i></div>
                  <p className="font-bold">NO PRODUCTS YET</p>
                  <p className="text-xs mt-2">Add products from CJ to start selling.</p>
                </td></tr>
              ) : products.map((p: any) => (
                <tr key={p.pid} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.productImage} alt="" className="w-10 h-10 rounded-[8px] object-cover border border-[#E2E8F0]" />
                      <span className="font-bold text-sm text-[#1E293B] truncate max-w-[250px]">{p.productName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-[#64748B]">{p.pid?.slice(0, 12)}...</td>
                  <td className="px-6 py-4 font-bold text-sm text-[#FF6B00]">${p.sellPrice || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold ${p.isListed === 1 ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                      {p.isListed === 1 ? 'Listed' : 'Unlisted'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-[#64748B]">{p.createTime ? new Date(p.createTime).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/products/${p.pid}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 no-underline">
                      View <i className="fas fa-chevron-right"></i>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-3 mt-8">
          <button className="px-4 py-2 rounded-[10px] text-sm font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 disabled:opacity-30" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <i className="fas fa-chevron-left"></i> Prev
          </button>
          <span className="px-4 py-2 text-sm font-bold text-[#1E293B]">Page {page} of {Math.ceil(total / 20)}</span>
          <button className="px-4 py-2 rounded-[10px] text-sm font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 disabled:opacity-30" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}
