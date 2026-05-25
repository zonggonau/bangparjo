'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminOrdersAction, fulfillAdminOrderAction, syncAdminOrderAction } from '@/lib/actions-admin-orders';

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

  const handleFulfill = async () => {
    if (!confirm(`Submit order ${orderNum} to CJ for fulfillment?`)) return;
    try {
      const data = await fulfillAdminOrderAction(orderNum) as any;
      alert(data.success ? 'Fulfillment initiated!' : 'Error: ' + (data.error || data.message));
      if (data.success) window.location.reload();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleSync = async () => {
    try {
      const data = await syncAdminOrderAction(order.id);
      alert(data.success ? 'Status synced: ' + data.status : 'Sync error: ' + data.error);
      if (data.success) window.location.reload();
    } catch (e: any) { alert('Error: ' + e.message); }
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
  const costAmount = order.costAmount || items.reduce((sum: number, i: any) => sum + (i.variant?.baseCost || 0) * i.quantity, 0);
  const profit = (order.totalAmount || 0) - costAmount - (order.shippingFee || 0);

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
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200" onClick={handleFulfill}>
                <i className="fas fa-check-circle"></i> Fulfill to CJ
              </button>
            )}
            {(order.cjOrderId || order.status === 'UNPAID') && (
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200" onClick={handleSync}>
                <i className="fas fa-sync"></i> Sync Status
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
          <h3 className="text-[22px] font-black text-[#EF4444]">{formatUSD(costAmount)}</h3>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Shipping</p>
          <h3 className="text-[22px] font-black text-[#38BDF8]">{formatUSD(order.shippingFee)}</h3>
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
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-8 text-center">
              <i className="fas fa-spinner fa-spin text-[#FF6B00]"></i>
              <p className="mt-3 text-sm font-bold text-[#64748B]">Loading CJ order data...</p>
            </div>
          ) : cjOrder ? (
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <i className="fas fa-globe text-[#FF6B00]"></i>
                  <h3 className="text-lg font-extrabold text-[#1E293B]">CJ Order Detail</h3>
                  <span className="ml-2 text-xs text-[#64748B]">(#{order.cjOrderId})</span>
                </div>
              </div>
              <div className="p-8">
                <pre className="bg-[#0F172A] text-[#38BDF8] rounded-[12px] p-5 text-xs font-mono max-h-[400px] overflow-auto leading-[1.6]">
                  {JSON.stringify(cjOrder, null, 2)}
                </pre>
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
                <i className="fas fa-database text-[#FF6B00]"></i>
                <h3 className="font-extrabold text-[#1E293B]">Raw Payload</h3>
              </div>
              <div className="p-6">
                <pre className="bg-[#F8FAFC] text-[#475569] rounded-[10px] p-4 text-[11px] font-mono max-h-[300px] overflow-auto leading-[1.6] border border-[#E2E8F0]">
                  {JSON.stringify(order.orderData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
