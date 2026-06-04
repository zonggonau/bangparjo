'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { getAdminOrdersAction, fulfillAdminOrderAction, syncAdminOrderAction, deleteCjOrderAction, confirmCjOrderAction, getCjPayTypeAction } from '@/lib/actions-admin-orders';

function formatUSD(price: number | string | null | undefined) {
  const p = typeof price === 'string' ? parseFloat(price) : (price || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || 'PENDING').toUpperCase();
  let badgeClass = 'bg-gray-100 text-gray-600';
  if (['PAID', 'FULFILLED', 'COMPLETED', 'DELIVERED'].includes(s)) badgeClass = 'bg-[#D1FAE5] text-[#065F46]';
  if (['SHIPPED'].includes(s)) badgeClass = 'bg-[#DBEAFE] text-[#1E40AF]';
  if (['UNPAID', 'PENDING'].includes(s)) badgeClass = 'bg-[#FFEDD5] text-[#9A3412]';
  if (['CANCELLED', 'FAILED'].includes(s)) badgeClass = 'bg-[#FEE2E2] text-[#991B1B]';
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>{s}</span>;
}

export default function AdminOrderDetail() {
  const params = useParams();
  const orderNum = params.orderNum as string;

  const [order, setOrder] = useState<any>(null);
  const [cjOrder, setCjOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cjLoading, setCjLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'fulfill' | 'sync';
    orderId: string;
  } | null>(null);
  const [cjPayType, setCjPayType] = useState<number>(3);

  useEffect(() => {
    getCjPayTypeAction().then(res => {
      if (res.success && res.payType !== undefined) {
        setCjPayType(res.payType);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!orderNum) return;
    setLoading(true);
    getAdminOrdersAction()
      .then(res => {
        const orders = res.success && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        const found = orders.find((o: any) => o.orderNum === orderNum || o.id === orderNum);
        if (found) setOrder(found);
        else setError('Order not found in local database.');
      })
      .catch(() => setError('Failed to load order.'))
      .finally(() => setLoading(false));
  }, [orderNum]);

  // Fetch CJ order detail if cjOrderId exists
  useEffect(() => {
    if (!order?.cjOrderId) return;
    setCjLoading(true);
    fetch(`/api/cj-orders/detail?orderId=${order.cjOrderId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setCjOrder(d.data); })
      .catch(console.error)
      .finally(() => setCjLoading(false));
  }, [order?.cjOrderId]);

  const executeFulfill = async () => {
    setBusy(true);
    setConfirmModal(null);
    try {
      const data = await fulfillAdminOrderAction(orderNum) as any;
      if (data.success) {
        toast.success('Fulfillment initiated!');
        window.location.reload();
      } else {
        toast.error('Error: ' + (data.error || data.message));
      }
    } catch (e: any) { 
      toast.error('Error: ' + e.message); 
    } finally {
      setBusy(false);
    }
  };

  const executeSync = async () => {
    setBusy(true);
    setConfirmModal(null);
    try {
      const data = await syncAdminOrderAction(order.id);
      if (data.success) {
        toast.success('Status synced: ' + data.status);
        window.location.reload();
      } else {
        toast.error('Sync error: ' + data.error);
      }
    } catch (e: any) { 
      toast.error('Error: ' + e.message); 
    } finally {
      setBusy(false);
    }
  };

  const handlePayBalance = async () => {
    if (!order?.cjOrderId) return;
    if (!confirm(`Pay for CJ Order ${order.cjOrderId} using your CJ balance?`)) return;
    setCjLoading(true);
    try {
      const res = await fetch('/api/cj-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: order.cjOrderId })
      });
      const data = await res.json();
      if (data.success || data.result) {
        alert('Payment successful!');
        window.location.reload();
      } else {
        alert('Payment failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setCjLoading(false);
    }
  };

  const handleDeleteCjOrder = async () => {
    if (!order?.cjOrderId) return;
    if (!confirm(`Delete CJ Order ${order.cjOrderId}? This cannot be undone.`)) return;
    setCjLoading(true);
    try {
      const data = await deleteCjOrderAction(order.cjOrderId) as any;
      if (data.success || data.result) {
        alert('Order deleted successfully from CJ.');
        window.location.reload();
      } else {
        alert('Failed to delete order: ' + (data.message || data.error));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setCjLoading(false);
    }
  };

  const handleConfirmCjOrder = async () => {
    if (!order?.cjOrderId) return;
    if (!confirm(`Confirm CJ Order ${order.cjOrderId}?`)) return;
    setCjLoading(true);
    try {
      const data = await confirmCjOrderAction(order.cjOrderId) as any;
      if (data.success || data.result) {
        alert('Order confirmed successfully on CJ.');
        window.location.reload();
      } else {
        alert('Failed to confirm order: ' + (data.message || data.error));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setCjLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-[100px]"><i className="fas fa-spinner fa-spin fa-2x text-[#FF6B00]"></i></div>;
  }

  if (error || !order) {
    return (
      <div className="text-center py-[100px]">
        <div className="text-[40px] text-gray-200 mb-4"><i className="fas fa-exclamation-circle"></i></div>
        <p className="font-bold text-gray-400 mb-6">{error || 'Order not found'}</p>
        <Link href="/dashboard/orders" className="inline-flex items-center px-6 py-3 rounded-[12px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] no-underline transition-all duration-200">
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  const address = order.shippingAddress as any;
  const items = order.items || [];
  
  const revenue = order.totalAmount || 0;
  const productWholesaleCost = items.reduce((sum: number, i: any) => sum + (i.price || 0) * i.quantity, 0);
  const baseShippingCost = Math.max(0, (order.costAmount || 0) - productWholesaleCost);
  const profit = revenue - productWholesaleCost - baseShippingCost;

  return (
    <>
      <div className="mb-8">
        <Link href="/dashboard/orders" className="text-sm text-[#FF6B00] font-bold no-underline hover:underline flex items-center gap-2 mb-3">
          <i className="fas fa-arrow-left"></i> Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-black text-[#1E293B]">Order #{order.orderNum?.slice(0, 16) || order.id?.slice(0, 16)}</h2>
            <p className="text-[#64748B] font-semibold">
              <i className="far fa-calendar-alt"></i> {new Date(order.createdAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex gap-3">
            {order.status === 'PAID' && !order.cjOrderId && (
              <button disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200" onClick={() => setConfirmModal({ type: 'fulfill', orderId: order.id })}>
                <i className={`fas fa-check-circle ${busy ? 'fa-spin' : ''}`}></i> Fulfill to CJ
              </button>
            )}
            {order.status === 'PAID' && order.cjOrderId && cjPayType === 2 && (
              <button disabled={cjLoading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200" onClick={handlePayBalance}>
                <i className={`fas fa-wallet ${cjLoading ? 'fa-spin' : ''}`}></i> Pay via CJ Balance
              </button>
            )}
            {(order.cjOrderId || order.status === 'UNPAID') && (
              <button disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" onClick={() => setConfirmModal({ type: 'sync', orderId: order.id })}>
                <i className={`fas fa-sync ${busy ? 'fa-spin' : ''}`}></i> Sync Status
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Revenue</p>
          <h3 className="text-[22px] font-black text-[#1E293B]">{formatUSD(order.totalAmount)}</h3>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Cost</p>
          <h3 className="text-[22px] font-black text-[#EF4444]">{formatUSD(productWholesaleCost)}</h3>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Shipping</p>
          <h3 className="text-[22px] font-black text-[#38BDF8]">{formatUSD(baseShippingCost)}</h3>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Profit</p>
          <h3 className={`text-[22px] font-black ${profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{formatUSD(profit)}</h3>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Status</p>
          <div className="mt-1"><StatusBadge status={order.status} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-8">
        {/* Left: Order Items */}
        <div className="space-y-6">
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-extrabold text-[#1E293B]">Order Items ({items.length})</h3>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {items.map((item: any) => {
                const v = item.variant;
                const p = v?.product;
                return (
                  <div key={item.id} className="px-8 py-4 flex items-center gap-4 hover:bg-[#FAFBFE] transition-all duration-200">
                    {p?.images?.[0] && <img src={p.images[0]} alt="" className="w-14 h-14 rounded-[10px] object-cover border border-[#E2E8F0]" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#1E293B] truncate">{p?.name || 'Product'}</p>
                      <p className="text-xs text-[#64748B]">{v?.color || v?.size ? `${v.color || ''} ${v.size || ''}`.trim() : 'Standard'} | SKU: {v?.sku}</p>
                      <div className="flex gap-3 mt-1 text-xs font-bold text-[#64748B]">
                        <span>Cost: <span className="text-[#EF4444]">${(v?.baseCost || 0).toFixed(2)}</span></span>
                        <span>Sell: <span className="text-[#10B981]">${(v?.sellingPrice || 0).toFixed(2)}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-[#1E293B]">{formatUSD(item.price)}</p>
                      <p className="text-xs text-[#64748B]">×{item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CJ Order Detail */}
          {cjLoading ? (
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-8 text-center shadow-sm">
              <i className="fas fa-circle-notch fa-spin text-[#FF6B00] fa-2x"></i>
              <p className="mt-3 text-sm font-bold text-[#64748B]">Retrieving live CJ network payload...</p>
            </div>
          ) : cjOrder ? (
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden space-y-6">
              {/* Card Header with Aksi Toolbar */}
              <div className="px-8 py-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
                <div className="flex items-center gap-2.5">
                  <i className="fas fa-globe text-[#FF6B00] text-lg"></i>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1E293B]">Live CJ Network Sync</h3>
                    <p className="text-[11px] text-[#64748B] font-semibold">CJ ID: #{order.cjOrderId}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(cjOrder.orderStatus || cjOrder.status || '').toUpperCase() === 'WAITPAY' && (
                    <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[11px] font-bold bg-[#10B981] text-white hover:bg-[#059669] transition-all duration-200" onClick={handlePayBalance} title="Pay via Balance">
                      <i className="fas fa-wallet"></i> Pay Balance
                    </button>
                  )}
                  {['WAITCONFIRM', 'DRAFT', 'PENDING'].includes((cjOrder.orderStatus || cjOrder.status || '').toUpperCase()) && (
                    <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[11px] font-bold bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-all duration-200" onClick={handleConfirmCjOrder} title="Confirm Order">
                      <i className="fas fa-check-double"></i> Confirm Order
                    </button>
                  )}
                  {['WAITPAY', 'DRAFT', 'WAITCONFIRM'].includes((cjOrder.orderStatus || cjOrder.status || '').toUpperCase()) && (
                    <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[11px] font-bold bg-[#EF4444] text-white hover:bg-[#DC2626] transition-all duration-200" onClick={handleDeleteCjOrder} title="Delete CJ Order">
                      <i className="fas fa-trash-alt"></i> Delete Order
                    </button>
                  )}
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[11px] font-bold border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" onClick={() => toast.error('Not implemented')}>
                    <i className="fas fa-sync"></i> Refresh Live
                  </button>
                </div>
              </div>

              <div className="px-8 pb-8 space-y-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center">
                    <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">CJ Status</p>
                    <StatusBadge status={cjOrder.orderStatus || cjOrder.status} />
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center">
                    <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Product Amount</p>
                    <p className="text-sm font-black text-[#1E293B]">${Number(cjOrder.productAmount || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center">
                    <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Postage Fee</p>
                    <p className="text-sm font-black text-[#38BDF8]">${Number(cjOrder.postageAmount || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center">
                    <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Actual Paid</p>
                    <p className="text-sm font-black text-[#10B981]">${Number(cjOrder.actualPayment || 0).toFixed(2)}</p>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="bg-[#FAFBFE] border border-[#E2E8F0] rounded-[16px] p-5">
                  <h4 className="font-extrabold text-sm text-[#1E293B] flex items-center gap-2 mb-3">
                    <i className="fas fa-truck text-[#FF6B00]"></i> CJ Shipping Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#475569]">
                    <div>
                      <p className="font-semibold text-gray-400 uppercase tracking-[0.02em]">Recipient Name</p>
                      <p className="font-bold text-[#1E293B] mt-0.5">{cjOrder.shippingCustomerName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-400 uppercase tracking-[0.02em]">Phone</p>
                      <p className="font-bold text-[#1E293B] mt-0.5">{cjOrder.shippingPhone || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="font-semibold text-gray-400 uppercase tracking-[0.02em]">Delivery Address</p>
                      <p className="font-bold text-[#1E293B] mt-0.5 text-xs leading-relaxed">
                        {cjOrder.shippingAddress} {cjOrder.shippingAddress2 || ''}
                        <br />
                        {cjOrder.shippingCity}, {cjOrder.shippingProvince} {cjOrder.shippingZip}
                        <br />
                        {cjOrder.shippingCountry} ({cjOrder.shippingCountryCode})
                      </p>
                    </div>
                  </div>
                </div>

                {/* CJ Order Items */}
                <div className="bg-white border border-[#E2E8F0] rounded-[16px] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#E2E8F0] bg-gray-50 flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-[#1E293B] flex items-center gap-2">
                      <i className="fas fa-boxes text-[#FF6B00]"></i> CJ Synced Items
                    </h4>
                  </div>
                  <div className="divide-y divide-[#F1F5F9]">
                    {(cjOrder.productInfoList || []).map((item: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-bold text-[#1E293B]">CJ SKU: <span className="font-semibold text-[#64748B]">{item.variantId || 'Variant'}</span></p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Line ID: {item.storeLineItemId || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-[#1E293B]">Qty: {item.quantity}</p>
                          <p className="text-[10px] text-green-600 font-semibold">{item.isGroup ? 'Main Package' : 'Standard'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accordion for JSON dump */}
                <details className="group border border-[#E2E8F0] rounded-[12px] bg-slate-50 overflow-hidden">
                  <summary className="px-5 py-3 flex items-center justify-between cursor-pointer font-bold text-xs text-[#64748B] select-none hover:bg-slate-100 transition-colors">
                    <span className="flex items-center gap-2"><i className="fas fa-code"></i> Live CJ JSON Payload Auditor</span>
                    <i className="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                  </summary>
                  <div className="px-5 pb-5 pt-2 border-t border-[#E2E8F0] bg-white">
                    <pre className="bg-[#0F172A] text-[#38BDF8] rounded-[10px] p-4 text-[10px] font-mono max-h-[300px] overflow-auto leading-[1.6]">
                      {JSON.stringify(cjOrder, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Order Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center gap-2">
              <i className="fas fa-user text-[#FF6B00]"></i>
              <h3 className="font-extrabold text-[#1E293B]">Customer</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em]">Name</p>
                <p className="font-bold text-sm text-[#1E293B] mt-1">{order.customerName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em]">Email</p>
                <p className="font-bold text-sm text-[#1E293B] mt-1">{order.customerEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em]">Phone</p>
                <p className="font-bold text-sm text-[#1E293B] mt-1">{order.customerPhone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {address && (
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-[#FF6B00]"></i>
                <h3 className="font-extrabold text-[#1E293B]">Shipping Address</h3>
              </div>
              <div className="p-6 space-y-2 text-sm text-[#475569]">
                <p className="font-bold text-[#1E293B]">{address.name || order.customerName}</p>
                <p>{address.line1 || address.address}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>{address.city}, {address.state} {address.postal_code || address.zip}</p>
                <p>{address.country}</p>
              </div>
            </div>
          )}

          {/* Tracking */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center gap-2">
              <i className="fas fa-truck text-[#FF6B00]"></i>
              <h3 className="font-extrabold text-[#1E293B]">Tracking</h3>
            </div>
            <div className="p-6">
              {order.trackingNumber ? (
                <div>
                  <a href={`https://www.17track.net/en/result?nums=${order.trackingNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-bold bg-[#F0F9FF] text-[#0369A1] no-underline hover:bg-[#E0F2FE] transition-all duration-200">
                    <i className="fas fa-external-link-alt"></i> {order.trackingNumber}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-[#94A3B8] font-semibold">No tracking number assigned yet.</p>
              )}
            </div>
          </div>

          {/* Order Data */}
          {order.orderData && (
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center gap-2">
                <i className="fas fa-file-invoice text-[#FF6B00]"></i>
                <h3 className="font-extrabold text-[#1E293B]">Fulfillment Details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em]">Logistics Method</p>
                    <p className="font-bold text-[#1E293B] mt-1">{order.orderData.logisticName || 'Default'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em]">Origin Country</p>
                    <p className="font-bold text-[#1E293B] mt-1">{order.orderData.fromCountryCode || 'CN'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em]">IOSS Configuration</p>
                    <p className="font-bold text-[#1E293B] mt-1">
                      {order.orderData.iossType === 1 ? "1 - Don't use IOSS" : 
                       order.orderData.iossType === 3 ? "3 - Use CJ IOSS" : 
                       order.orderData.iossType || 'N/A'}
                    </p>
                  </div>
                </div>

                <details className="mt-4 border border-[#E2E8F0] rounded-[10px] overflow-hidden group">
                  <summary className="px-4 py-3 bg-[#F8FAFC] text-xs font-bold text-[#64748B] cursor-pointer hover:bg-[#F1F5F9] transition-colors flex items-center justify-between">
                    <span>View Raw JSON Data</span>
                    <i className="fas fa-chevron-down group-open:rotate-180 transition-transform"></i>
                  </summary>
                  <pre className="bg-[#F8FAFC] text-[#475569] p-4 text-[11px] font-mono max-h-[300px] overflow-auto leading-[1.6]">
                    {JSON.stringify(order.orderData, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real React Modal for Confirmation */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-sm w-full bg-white shadow-2xl rounded-[16px] pointer-events-auto flex flex-col overflow-hidden animate-slide-up-fade">
            <div className="p-5 flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${confirmModal.type === 'fulfill' ? 'bg-orange-100 text-orange-500' : 'bg-emerald-100 text-emerald-600'}`}>
                <i className={`fas ${confirmModal.type === 'fulfill' ? 'fa-paper-plane' : 'fa-sync'}`}></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{confirmModal.type === 'fulfill' ? 'Fulfill Order?' : 'Sync Status?'}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {confirmModal.type === 'fulfill' 
                    ? <span>Submit order <b>#{orderNum.slice(0, 8)}...</b> to CJ terminal for fulfillment.</span>
                    : <span>Synchronize current status from CJ.</span>
                  }
                </p>
              </div>
            </div>
            <div className="flex border-t border-gray-100 bg-gray-50">
              <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border-r border-gray-100">Cancel</button>
              <button 
                onClick={() => confirmModal.type === 'fulfill' ? executeFulfill() : executeSync()} 
                className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${confirmModal.type === 'fulfill' ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
