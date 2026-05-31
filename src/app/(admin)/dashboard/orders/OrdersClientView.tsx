'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fulfillAdminOrderAction, syncAdminOrderAction, markOrderAsPaidAction } from '@/lib/actions-admin-orders';
import { toast } from 'react-hot-toast';

function StatusBadge({ status }: { status: string }) {
  const s = (status || 'PENDING').toUpperCase();
  
  let badgeClass = 'bg-gray-100 text-gray-600';
  if (['PAID', 'FULFILLED', 'COMPLETED', 'DELIVERED'].includes(s)) badgeClass = 'bg-[#D1FAE5] text-[#065F46]';
  if (['SHIPPED'].includes(s)) badgeClass = 'bg-[#DBEAFE] text-[#1E40AF]';
  if (['FULFILLING', 'PROCESSING'].includes(s)) badgeClass = 'bg-[#FEF08A] text-[#854D0E]';
  if (['UNPAID', 'PENDING'].includes(s)) badgeClass = 'bg-[#FFEDD5] text-[#9A3412]';
  if (['CANCELLED', 'FAILED'].includes(s)) badgeClass = 'bg-[#FEE2E2] text-[#991B1B]';

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
      {s}
    </span>
  );
}

export default function OrdersClientView({ 
  orders, 
  currentSource, 
  currentStatus, 
  currentSearch,
  total = 0,
  currentPage = 1
}: { 
  orders: any[], 
  currentSource: string,
  currentStatus: string,
  currentSearch: string,
  total?: number,
  currentPage?: number
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(currentSearch);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'fulfill' | 'markPaid';
    orderNum: string;
    orderId: string;
  } | null>(null);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    
    // Reset page to 1 whenever a filter (other than page) is updated
    if (key !== 'page') {
      params.delete('page');
    }
    
    router.push(`/dashboard/orders?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters('search', localSearch);
  };

  const handleFulfill = (orderNum: string, orderId: string) => {
    setConfirmModal({ type: 'fulfill', orderNum, orderId });
  };
  
  const executeFulfill = async (orderNum: string) => {
    setBusy(orderNum);
    setConfirmModal(null);
    try {
      const data = await fulfillAdminOrderAction(orderNum) as any;
      if (data.success) { 
        toast.success('Fulfillment sequence initialized successfully.'); 
        router.refresh();
      } else {
        toast.error('Sequence failure: ' + (data.error || data.message));
      }
    } catch (e: any) { 
      toast.error('Critical error: ' + e.message); 
    } finally { 
      setBusy(null); 
    }
  };

  const handleSync = async (orderId: string) => {
    setBusy(orderId);
    try {
      const data = await syncAdminOrderAction(orderId);
      if (data.success) { 
        toast.success('Status synchronization complete: ' + data.status); 
        router.refresh();
      } else {
        toast.error('Sync failure: ' + data.error);
      }
    } catch (e: any) { 
      toast.error('Critical error: ' + e.message); 
    } finally { 
      setBusy(null); 
    }
  };

  const handleMarkAsPaid = (orderId: string, orderNum: string) => {
    setConfirmModal({ type: 'markPaid', orderNum, orderId });
  };

  const executeMarkAsPaid = async (orderId: string) => {
    setBusy(orderId);
    setConfirmModal(null);
    try {
      const data = await markOrderAsPaidAction(orderId) as any;
      if (data.success) {
        toast.success('Order marked as PAID successfully.');
        router.refresh();
      } else {
        toast.error('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      toast.error('Critical error: ' + e.message);
    } finally {
      setBusy(null);
    }
  };

  const STATUSES = ['ALL', 'UNPAID', 'PAID', 'FULFILLING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
  const [exporting, setExporting] = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('source', currentSource);
      params.set('status', currentStatus);
      if (currentSearch) params.set('search', currentSearch);

      const res = await fetch(`/api/admin/orders/export?${params.toString()}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `HTTP ${res.status}: Export failed`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error('Export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Order Management</h2>
        <p className="text-[#64748B] font-semibold">Track and fulfill your store orders via CJ Dropshipping.</p>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] mb-8 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-[12px]">
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${currentSource === 'LOCAL' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => updateFilters('source', 'LOCAL')}
            >
              <i className="fas fa-database"></i> Store Core
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${currentSource === 'CJ' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => updateFilters('source', 'CJ')}
            >
              <i className="fas fa-globe"></i> CJ Network
            </button>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 disabled:opacity-50" onClick={exportCSV} disabled={orders.length === 0 || exporting}>
              <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-download'}`}></i> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" onClick={() => router.refresh()}>
              <i className={`fas fa-sync`}></i> Refresh
            </button>
          </div>
        </div>
        
        <div className="p-6 flex flex-wrap gap-5 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(st => (
              <button 
                key={st} 
                className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-[0.05em] transition-all duration-200 ${currentStatus === st ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                onClick={() => updateFilters('status', st)}
              >
                {st}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[320px]">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Search by Order ID or Name..." 
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full py-3 pl-11 pr-4 rounded-[12px] border border-[#E2E8F0] bg-gray-50 text-sm outline-none focus:border-[#FF6B00] focus:shadow-[0_0_0_4px_#FFF3E0] focus:bg-white transition-all duration-200"
            />
            <button type="submit" className="hidden">Search</button>
          </form>
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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-[100px]">
                    <div className="text-[40px] text-gray-200 mb-4"><i className="fas fa-inbox"></i></div>
                    <p className="font-bold text-gray-400">NO ORDERS FOUND</p>
                  </td>
                </tr>
              ) : (
                orders.map(o => {
                  const orderId = o.orderNum || o.orderId || o.id;
                  const isBusy = busy === orderId;
                  return (
                    <tr key={o.id || orderId} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <Link 
                            href={`/dashboard/orders/${orderId}`} 
                            className="font-extrabold text-[#1E293B] hover:text-[#FF6B00] transition-colors cursor-pointer"
                          >
                            #{orderId.slice(0, 12)}...
                          </Link>
                          {currentSource === 'LOCAL' && o.checkoutToken && (
                             <span className="text-[10px] text-green-600 font-bold">
                               <i className="fas fa-shield-alt"></i> Secure Session
                             </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[#1E293B]">{o.customerName || o.shippingCustomerName || 'Anonymous'}</span>
                          <span className="text-gray-400 text-xs">{o.customerEmail || 'No Email Provided'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-extrabold text-[15px] text-[#1E293B]">
                          ${Number(o.totalAmount || o.orderAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={o.status || o.orderStatus} />
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
                          {currentSource === 'LOCAL' && (o.status || '').toUpperCase() === 'PAID' && !o.cjOrderId && (
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200" disabled={isBusy} onClick={() => handleFulfill(o.orderNum, orderId)} title="Fulfill to CJ">
                              <i className={`fas fa-check-circle ${isBusy ? 'fa-spin' : ''}`}></i>
                            </button>
                          )}
                          {currentSource === 'LOCAL' && (o.status || '').toUpperCase() === 'UNPAID' && (
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200"
                              disabled={isBusy}
                              onClick={() => handleMarkAsPaid(o.id, orderId)}
                              title="Manually mark as Paid (use when webhook failed)"
                            >
                              <i className={`fas fa-credit-card ${isBusy ? 'fa-spin' : ''}`}></i>
                            </button>
                          )}
                          {(o.cjOrderId || (currentSource === 'LOCAL' && o.status === 'UNPAID')) && (
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" disabled={isBusy} onClick={() => handleSync(o.id)} title="Sync Status">
                              <i className={`fas fa-sync ${isBusy ? 'fa-spin' : ''}`}></i>
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
      
      {/* Pagination */}
      {Math.ceil(total / 10) > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button 
            className="px-4 py-2 rounded-[10px] text-sm font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 disabled:opacity-30" 
            disabled={currentPage <= 1} 
            onClick={() => updateFilters('page', String(currentPage - 1))}
          >
            <i className="fas fa-chevron-left"></i> Prev
          </button>
          <span className="px-4 py-2 text-sm font-bold text-[#1E293B]">Page {currentPage} of {Math.ceil(total / 10)}</span>
          <button 
            className="px-4 py-2 rounded-[10px] text-sm font-bold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200 disabled:opacity-30" 
            disabled={currentPage >= Math.ceil(total / 10)} 
            onClick={() => updateFilters('page', String(currentPage + 1))}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
      
      {/* Real React Modal for Confirmation */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="max-w-sm w-full bg-white shadow-2xl rounded-[16px] pointer-events-auto flex flex-col overflow-hidden animate-slide-up-fade">
            <div className="p-5 flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${confirmModal.type === 'fulfill' ? 'bg-orange-100 text-orange-500' : 'bg-emerald-100 text-emerald-600'}`}>
                <i className={`fas ${confirmModal.type === 'fulfill' ? 'fa-paper-plane' : 'fa-credit-card'}`}></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{confirmModal.type === 'fulfill' ? 'Fulfill Order?' : 'Mark as Paid?'}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {confirmModal.type === 'fulfill' 
                    ? <span>Send order <b>#{confirmModal.orderNum}</b> to CJ terminal for fulfillment.</span>
                    : <span>Manually mark order <b>#{confirmModal.orderNum}</b> as PAID. Use this only if payment was confirmed outside the system.</span>
                  }
                </p>
              </div>
            </div>
            <div className="flex border-t border-gray-100 bg-gray-50">
              <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border-r border-gray-100">Cancel</button>
              <button 
                onClick={() => confirmModal.type === 'fulfill' ? executeFulfill(confirmModal.orderNum) : executeMarkAsPaid(confirmModal.orderId)} 
                className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${confirmModal.type === 'fulfill' ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
