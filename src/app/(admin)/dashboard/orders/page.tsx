'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminOrdersAction, fulfillAdminOrderAction, syncAdminOrderAction } from '@/lib/actions-admin-orders';

function StatusBadge({ status }: { status: string }) {
  const s = (status || 'PENDING').toUpperCase();
  
  let badgeClass = 'bg-gray-100 text-gray-600';
  if (['PAID', 'FULFILLED', 'COMPLETED', 'DELIVERED'].includes(s)) badgeClass = 'bg-[#D1FAE5] text-[#065F46]';
  if (['SHIPPED'].includes(s)) badgeClass = 'bg-[#DBEAFE] text-[#1E40AF]';
  if (['UNPAID', 'PENDING'].includes(s)) badgeClass = 'bg-[#FFEDD5] text-[#9A3412]';
  if (['CANCELLED', 'FAILED'].includes(s)) badgeClass = 'bg-[#FEE2E2] text-[#991B1B]';

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
      {s}
    </span>
  );
}

export default function OrdersPage() {
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    getAdminOrdersAction()
      .then(res => { 
        if (res.success && Array.isArray(res.data)) {
          setLocalOrders(res.data);
        } else if (Array.isArray(res)) {
          setLocalOrders(res);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchOrders(); 
  }, []);

  const handleFulfill = async (orderNum: string) => {
    if (!confirm(`Initialize fulfillment sequence for order ${orderNum} to CJ terminal?`)) return;
    setBusy(orderNum);
    try {
      const data = await fulfillAdminOrderAction(orderNum) as any;
      if (data.success) { 
        alert('Fulfillment sequence initialized successfully.'); 
        fetchOrders(); 
      } else {
        alert('Sequence failure: ' + (data.error || data.message));
      }
    } catch (e: any) { 
      alert('Critical error: ' + e.message); 
    } finally { 
      setBusy(null); 
    }
  };

  const handleSync = async (orderNum: string) => {
    setBusy(orderNum);
    try {
      const data = await syncAdminOrderAction(orderNum);
      if (data.success) { 
        alert('Status synchronization complete: ' + data.status); 
        fetchOrders(); 
      } else {
        alert('Sync failure: ' + data.error);
      }
    } catch (e: any) { 
      alert('Critical error: ' + e.message); 
    } finally { 
      setBusy(null); 
    }
  };

  const filtered = localOrders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || (o.status || '').toUpperCase() === statusFilter;
    const term = search.toLowerCase();
    const matchSearch = !term || (o.orderNum || '').toLowerCase().includes(term)
      || (o.customerName || '').toLowerCase().includes(term)
      || (o.customerEmail || '').toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const STATUSES = ['ALL', 'UNPAID', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

  const exportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Amount', 'Status', 'Tracking', 'Date'];
    const rows = filtered.map(o => [
      o.orderNum || '',
      o.customerName || '',
      o.customerEmail || '',
      `$${Number(o.totalAmount || 0).toFixed(2)}`,
      o.status || '',
      o.trackingNumber || '',
      o.createdAt ? new Date(o.createdAt).toISOString() : '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] mb-8 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-[#1E293B]">
                <i className="fas fa-database text-[#FF6B00] mr-2"></i> Store Core Orders
              </span>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" onClick={exportCSV} disabled={filtered.length === 0}>
                <i className="fas fa-download"></i> Export CSV
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" onClick={fetchOrders} disabled={loading}>
                <i className={`fas fa-sync ${loading ? 'fa-spin' : ''}`}></i> Refresh
              </button>
            </div>
          </div>
          
          <div className="p-6 flex flex-wrap gap-5 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(st => (
                <button 
                  key={st} 
                  className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-[0.05em] transition-all duration-200 ${statusFilter === st ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
            
            <div className="relative w-full max-w-[320px]">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input 
                type="text" 
                placeholder="Search by Order ID or Name..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full py-3 pl-11 pr-4 rounded-[12px] border border-[#E2E8F0] bg-gray-50 text-sm outline-none focus:border-[#FF6B00] focus:shadow-[0_0_0_4px_#FFF3E0] focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase">Identity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase">Customer</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase">Amount</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase">Tracking</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase">Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-[100px]">
                      <i className="fas fa-circle-notch fa-spin fa-2x text-[#FF6B00] mb-4"></i>
                      <p className="font-bold text-gray-400 text-[13px]">SYNCHRONIZING ORDERS...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-[100px]">
                      <div className="text-[40px] text-gray-200 mb-4"><i className="fas fa-inbox"></i></div>
                      <p className="font-bold text-gray-400">NO ORDERS FOUND</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(o => {
                    const orderId = o.orderNum;
                    const isBusy = busy === orderId;
                    return (
                      <tr key={o.id || orderId} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <Link href={`/dashboard/orders/${orderId}`} className="font-extrabold text-[#1E293B] hover:text-[#FF6B00] hover:underline text-sm">
                              #{orderId.slice(0, 12)}...
                            </Link>
                            {o.checkoutToken && (
                              <span className="text-[10px] text-green-600 font-bold">
                                <i className="fas fa-shield-alt"></i> Secure Session
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[#1E293B]">{o.customerName || 'Anonymous'}</span>
                            <span className="text-gray-400 text-xs">{o.customerEmail || 'No Email Provided'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-extrabold text-[15px] text-[#1E293B]">
                            ${Number(o.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          {o.trackingNumber ? (
                            <a 
                              href={`https://www.17track.net/en/result?nums=${o.trackingNumber}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-gray-50 text-[#FF6B00] no-underline"
                            >
                              <i className="fas fa-truck"></i> {o.trackingNumber}
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">Not Shipped</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold text-gray-400">
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2 justify-end">
                            {(o.status || '').toUpperCase() === 'PAID' && !o.cjOrderId && (
                              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200" disabled={isBusy} onClick={() => handleFulfill(o.orderNum)} title="Fulfill to CJ">
                                <i className={`fas fa-check-circle ${isBusy ? 'fa-spin' : ''}`}></i> Fulfill
                              </button>
                            )}
                            {(o.cjOrderId || o.status === 'UNPAID') && (
                              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" disabled={isBusy} onClick={() => handleSync(o.orderNum)} title="Sync Status">
                                <i className={`fas fa-sync ${isBusy ? 'fa-spin' : ''}`}></i> Sync
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
