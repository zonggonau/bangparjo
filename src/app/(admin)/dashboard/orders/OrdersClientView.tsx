'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  fulfillAdminOrderAction, 
  syncAdminOrderAction, 
  markOrderAsPaidAction,
  cancelOrderAction,
  deleteLocalOrderAction,
  bulkDeleteOrdersAction,
} from '@/lib/actions-admin-orders';
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

const NON_CANCELLABLE = ['CANCELLED', 'DELIVERED', 'COMPLETED', 'SHIPPED'];

export default function OrdersClientView({ 
  orders, 
  currentSource, 
  currentStatus, 
  currentSearch,
  total = 0,
  currentPage = 1,
  cjPayType = 3
}: { 
  orders: any[], 
  currentSource: string,
  currentStatus: string,
  currentSearch: string,
  total?: number,
  currentPage?: number,
  cjPayType?: number
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(currentSearch);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'fulfill' | 'markPaid' | 'cancel' | 'delete';
    orderNum: string;
    orderId: string;
  } | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const cancelledOrders = orders.filter(o => (o.status || '').toUpperCase() === 'CANCELLED');

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cancelledOrders.length && cancelledOrders.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cancelledOrders.map((o: any) => o.id)));
    }
  };

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

  const handleCancel = (orderId: string, orderNum: string) => {
    setConfirmModal({ type: 'cancel', orderNum, orderId });
  };

  const executeCancel = async (orderId: string) => {
    setBusy(orderId);
    setConfirmModal(null);
    try {
      const data = await cancelOrderAction(orderId) as any;
      if (data.success) {
        toast.success('Order cancelled successfully.');
        setSelectedIds(prev => { const n = new Set(prev); n.delete(orderId); return n; });
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

  const handleDelete = (orderId: string, orderNum: string) => {
    setConfirmModal({ type: 'delete', orderNum, orderId });
  };

  const executeDelete = async (orderId: string) => {
    setBusy(orderId);
    setConfirmModal(null);
    try {
      const data = await deleteLocalOrderAction(orderId) as any;
      if (data.success) {
        toast.success('Order deleted permanently.');
        setSelectedIds(prev => { const n = new Set(prev); n.delete(orderId); return n; });
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

  const executeBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const data = await bulkDeleteOrdersAction(Array.from(selectedIds)) as any;
      if (data.success) {
        toast.success(`${data.deletedCount} order(s) deleted permanently.`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error('Bulk delete failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      toast.error('Critical error: ' + e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const handlePayCjBalance = async (cjOrderId: string) => {
    if (!confirm(`Pay for CJ Order ${cjOrderId} using your CJ balance?`)) return;
    setBusy(cjOrderId);
    try {
      const res = await fetch('/api/cj-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: cjOrderId })
      });
      const data = await res.json();
      if (data.success || data.result) {
        toast.success('Payment successful!');
        router.refresh();
      } else {
        toast.error('Payment failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
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

  const allCancelledSelected = cancelledOrders.length > 0 && selectedIds.size === cancelledOrders.length;
  const hasCancelledSelected = selectedIds.size > 0;

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

      {/* Bulk Action Bar — visible when CANCELLED orders are selected */}
      {hasCancelledSelected && (
        <div className="flex items-center justify-between bg-[#FEF2F2] border border-[#FCA5A5] rounded-[12px] px-5 py-3 mb-4 animate-fade-in">
          <span className="text-sm font-bold text-[#991B1B]">
            <i className="fas fa-check-square mr-2"></i>
            {selectedIds.size} CANCELLED order{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200"
              onClick={() => setSelectedIds(new Set())}
            >
              <i className="fas fa-times"></i> Deselect All
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-bold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-all duration-200 disabled:opacity-50"
              onClick={executeBulkDelete}
              disabled={bulkBusy}
            >
              <i className={`fas ${bulkBusy ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
              {bulkBusy ? 'Deleting...' : `Delete ${selectedIds.size} Order${selectedIds.size > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                {/* Checkbox column — only show if viewing LOCAL source where cancel/delete apply */}
                {currentSource === 'LOCAL' && (
                  <th className="px-5 py-3.5 w-10">
                    {cancelledOrders.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allCancelledSelected}
                        onChange={toggleSelectAll}
                        title="Select all CANCELLED orders"
                        className="w-4 h-4 rounded accent-[#DC2626] cursor-pointer"
                      />
                    )}
                  </th>
                )}
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
                  <td colSpan={currentSource === 'LOCAL' ? 8 : 7} className="text-center py-[100px]">
                    <div className="text-[40px] text-gray-200 mb-4"><i className="fas fa-inbox"></i></div>
                    <p className="font-bold text-gray-400">NO ORDERS FOUND</p>
                  </td>
                </tr>
              ) : (
                orders.map(o => {
                  const orderId = o.orderNum || o.orderId || o.id;
                  const isBusy = busy === orderId || busy === o.id;
                  const statusUpper = (o.status || '').toUpperCase();
                  const isCancelled = statusUpper === 'CANCELLED';
                  const canCancel = currentSource === 'LOCAL' && !NON_CANCELLABLE.includes(statusUpper);
                  const isSelected = selectedIds.has(o.id);

                  return (
                    <tr 
                      key={o.id || orderId} 
                      className={`border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200 ${isCancelled && isSelected ? 'bg-[#FFF5F5]' : ''}`}
                    >
                      {/* Checkbox — only for CANCELLED orders in LOCAL source */}
                      {currentSource === 'LOCAL' && (
                        <td className="px-5 py-3.5">
                          {isCancelled && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(o.id)}
                              className="w-4 h-4 rounded accent-[#DC2626] cursor-pointer"
                            />
                          )}
                        </td>
                      )}
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
                          {currentSource === 'LOCAL' && statusUpper === 'PAID' && !o.cjOrderId && (
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200" disabled={isBusy} onClick={() => handleFulfill(o.orderNum, orderId)} title="Fulfill to CJ">
                              <i className={`fas fa-check-circle ${isBusy ? 'fa-spin' : ''}`}></i>
                            </button>
                          )}
                          {currentSource === 'LOCAL' && statusUpper === 'PAID' && o.cjOrderId && cjPayType === 2 && (
                            <button 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200" 
                              disabled={isBusy} 
                              onClick={() => handlePayCjBalance(o.cjOrderId)} 
                              title="Pay via CJ Balance"
                            >
                              <i className={`fas fa-wallet ${isBusy ? 'fa-spin' : ''}`}></i>
                            </button>
                          )}
                          {currentSource === 'LOCAL' && ['UNPAID', 'FULFILLING'].includes(statusUpper) && (
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200"
                              disabled={isBusy}
                              onClick={() => handleMarkAsPaid(o.id, orderId)}
                              title={o.status === 'FULFILLING' ? "Reset status to PAID to retry fulfillment" : "Manually mark as Paid"}
                            >
                              <i className={`fas fa-undo ${isBusy ? 'fa-spin' : ''}`}></i>
                            </button>
                          )}
                          {(o.cjOrderId || (currentSource === 'LOCAL' && o.status === 'UNPAID')) && (
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" disabled={isBusy} onClick={() => handleSync(o.id)} title="Sync Status">
                              <i className={`fas fa-sync ${isBusy ? 'fa-spin' : ''}`}></i>
                            </button>
                          )}
                          {/* Cancel button — only for non-final statuses in LOCAL source */}
                          {canCancel && (
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-all duration-200"
                              disabled={isBusy}
                              onClick={() => handleCancel(o.id, orderId)}
                              title="Cancel Order"
                            >
                              <i className={`fas fa-ban ${isBusy ? 'fa-spin' : ''}`}></i>
                            </button>
                          )}
                          {/* Delete button — ONLY for CANCELLED orders */}
                          {isCancelled && currentSource === 'LOCAL' && (
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-semibold bg-red-50 text-[#DC2626] border border-red-200 hover:bg-red-100 transition-all duration-200"
                              disabled={isBusy}
                              onClick={() => handleDelete(o.id, orderId)}
                              title="Delete Order Permanently"
                            >
                              <i className={`fas fa-trash ${isBusy ? 'fa-spin' : ''}`}></i>
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
      
      {/* React Modal for Confirmation */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-sm w-full bg-white shadow-2xl rounded-[16px] pointer-events-auto flex flex-col overflow-hidden animate-slide-up-fade">
            <div className="p-5 flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                confirmModal.type === 'fulfill' ? 'bg-orange-100 text-orange-500' : 
                confirmModal.type === 'markPaid' ? 'bg-emerald-100 text-emerald-600' :
                confirmModal.type === 'cancel' ? 'bg-amber-100 text-amber-600' :
                'bg-red-100 text-red-600'
              }`}>
                <i className={`fas ${
                  confirmModal.type === 'fulfill' ? 'fa-paper-plane' : 
                  confirmModal.type === 'markPaid' ? 'fa-credit-card' :
                  confirmModal.type === 'cancel' ? 'fa-ban' :
                  'fa-trash'
                }`}></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {confirmModal.type === 'fulfill' ? 'Fulfill Order?' : 
                   confirmModal.type === 'markPaid' ? 'Mark as Paid?' :
                   confirmModal.type === 'cancel' ? 'Cancel Order?' :
                   'Delete Order?'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {confirmModal.type === 'fulfill' && <span>Send order <b>#{confirmModal.orderNum}</b> to CJ terminal for fulfillment.</span>}
                  {confirmModal.type === 'markPaid' && <span>Manually mark order <b>#{confirmModal.orderNum}</b> as PAID. Use this only if payment was confirmed outside the system.</span>}
                  {confirmModal.type === 'cancel' && <span>Cancel order <b>#{confirmModal.orderNum}</b>? Status will be changed to CANCELLED. This cannot be undone easily.</span>}
                  {confirmModal.type === 'delete' && <span>Permanently delete CANCELLED order <b>#{confirmModal.orderNum}</b>? This action <strong>cannot be undone</strong>.</span>}
                </p>
              </div>
            </div>
            <div className="flex border-t border-gray-100 bg-gray-50">
              <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border-r border-gray-100">Cancel</button>
              <button 
                onClick={() => {
                  if (confirmModal.type === 'fulfill') executeFulfill(confirmModal.orderNum);
                  else if (confirmModal.type === 'markPaid') executeMarkAsPaid(confirmModal.orderId);
                  else if (confirmModal.type === 'cancel') executeCancel(confirmModal.orderId);
                  else executeDelete(confirmModal.orderId);
                }} 
                className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
                  confirmModal.type === 'fulfill' ? 'text-orange-600 hover:bg-orange-50' : 
                  confirmModal.type === 'markPaid' ? 'text-emerald-600 hover:bg-emerald-50' :
                  confirmModal.type === 'cancel' ? 'text-amber-600 hover:bg-amber-50' :
                  'text-red-600 hover:bg-red-50'
                }`}
              >
                {confirmModal.type === 'delete' ? 'Delete Permanently' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
