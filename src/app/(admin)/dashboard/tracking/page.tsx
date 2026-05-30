'use client';

import { useState, useEffect } from 'react';

interface TrackingOrder {
  orderNum: string;
  cjOrderId: string | null;
  trackingNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TrackInfo {
  trackingNumber: string;
  logisticName: string;
  trackingFrom: string;
  trackingTo: string;
  deliveryDay: string;
  deliveryTime: string;
  trackingStatus: string;
  lastMileCarrier: string;
  lastTrackNumber: string;
}

const STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-gray-100 text-gray-600',
  PAID: 'bg-blue-100 text-blue-700',
  FULFILLING: 'bg-yellow-100 text-yellow-700',
  FULFILLED: 'bg-purple-100 text-purple-700',
  PROCESSING: 'bg-orange-100 text-orange-700',
  SHIPPED: 'bg-green-100 text-green-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<string, string> = {
  SHIPPED: 'fa-shipping-fast',
  DELIVERED: 'fa-check-circle',
  PROCESSING: 'fa-cog',
  FULFILLED: 'fa-box-open',
  CANCELLED: 'fa-times-circle',
};

export default function TrackingPage() {
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackData, setTrackData] = useState<Record<string, TrackInfo>>({});
  const [trackingNum, setTrackingNum] = useState('');
  const [trackingResult, setTrackingResult] = useState<TrackInfo | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [statusFilter, setStatusFilter] = useState('SHIPPED');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/orders${qs}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (e: any) {
      showToast('Failed to fetch orders: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleTrackLookup = async () => {
    if (!trackingNum.trim()) return;
    setLookingUp(true);
    setTrackingResult(null);
    try {
      const res = await fetch(`/api/cj-warehouse/track?trackingNumber=${encodeURIComponent(trackingNum.trim())}`);
      const data = await res.json();
      if (data.success && data.data?.[0]) {
        setTrackingResult(data.data[0]);
      } else {
        showToast('No tracking data found', 'error');
      }
    } catch (e: any) {
      showToast('Tracking lookup failed: ' + e.message, 'error');
    } finally {
      setLookingUp(false);
    }
  };

  const shippedCount = orders.filter(o => o.status === 'SHIPPED').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
  const inTransitCount = orders.filter(o => ['SHIPPED', 'FULFILLED', 'PROCESSING'].includes(o.status)).length;

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} />
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Order Tracking</h2>
          <p className="text-[#64748B] font-semibold">Monitor shipments and track packages in real-time.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[12px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200"
        >
          <i className={`fas fa-sync ${loading ? 'fa-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'In Transit', value: inTransitCount, icon: 'fa-shipping-fast', color: 'bg-blue-500' },
          { label: 'Shipped', value: shippedCount, icon: 'fa-box', color: 'bg-purple-500' },
          { label: 'Delivered', value: deliveredCount, icon: 'fa-check-circle', color: 'bg-green-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 ${stat.color} rounded-[12px] flex items-center justify-center text-white text-lg`}>
              <i className={`fas ${stat.icon}`} />
            </div>
            <div>
              <div className="text-[28px] font-black text-[#1E293B] leading-none">{stat.value}</div>
              <div className="text-sm text-[#64748B] font-semibold mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Track Lookup */}
      <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-8 mb-8 shadow-sm">
        <h3 className="font-black text-[#1E293B] mb-2">Quick Tracking Lookup</h3>
        <p className="text-[#64748B] text-sm mb-6">Enter a tracking number to get real-time shipment status from CJ.</p>
        <div className="flex gap-3">
          <input
            type="text"
            id="tracking-number-input"
            value={trackingNum}
            onChange={e => setTrackingNum(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrackLookup()}
            placeholder="e.g. CJ123456789CN"
            className="flex-1 px-4 py-3 rounded-[12px] border-2 border-[#E2E8F0] focus:border-[#FF6B00] outline-none text-sm font-semibold text-[#1E293B] placeholder-[#94A3B8] transition-colors"
          />
          <button
            id="track-lookup-btn"
            onClick={handleTrackLookup}
            disabled={lookingUp || !trackingNum.trim()}
            className="px-6 py-3 rounded-[12px] text-sm font-bold bg-[#1E293B] text-white hover:bg-[#0F172A] disabled:opacity-50 transition-all"
          >
            {lookingUp ? <><i className="fas fa-circle-notch fa-spin mr-2" />Tracking...</> : <><i className="fas fa-search mr-2" />Track</>}
          </button>
        </div>

        {/* Tracking Result */}
        {trackingResult && (
          <div className="mt-6 p-6 bg-[#F8FAFC] rounded-[16px] border border-[#E2E8F0] animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-[#64748B] font-bold uppercase tracking-wide mb-1">Tracking No.</div>
                <div className="font-black text-[#1E293B] text-sm">{trackingResult.trackingNumber}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B] font-bold uppercase tracking-wide mb-1">Status</div>
                <div className="font-black text-[#FF6B00] text-sm">{trackingResult.trackingStatus}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B] font-bold uppercase tracking-wide mb-1">Carrier</div>
                <div className="font-bold text-[#1E293B] text-sm">{trackingResult.logisticName || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B] font-bold uppercase tracking-wide mb-1">Est. Delivery</div>
                <div className="font-bold text-[#1E293B] text-sm">{trackingResult.deliveryDay || '-'}</div>
              </div>
              {trackingResult.lastMileCarrier && (
                <div>
                  <div className="text-xs text-[#64748B] font-bold uppercase tracking-wide mb-1">Last Mile</div>
                  <div className="font-bold text-[#1E293B] text-sm">{trackingResult.lastMileCarrier}</div>
                </div>
              )}
              {trackingResult.lastTrackNumber && (
                <div>
                  <div className="text-xs text-[#64748B] font-bold uppercase tracking-wide mb-1">Local Track#</div>
                  <div className="font-bold text-[#1E293B] text-sm">{trackingResult.lastTrackNumber}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-black text-[#1E293B]">Orders with Tracking</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-bold">Filter:</span>
            {['', 'SHIPPED', 'DELIVERED', 'FULFILLED', 'PROCESSING'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-[8px] text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
                  statusFilter === s
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                {['Order', 'Customer', 'Tracking Number', 'Status', 'Updated'].map(h => (
                  <th key={h} className="text-left px-8 py-4 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16"><i className="fas fa-circle-notch fa-spin fa-2x text-[#FF6B00]" /></td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-[#64748B]">
                    <div className="text-[40px] opacity-10 mb-3"><i className="fas fa-truck" /></div>
                    <p className="font-bold">No orders found</p>
                    <p className="text-sm mt-1">Try changing the filter.</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.orderNum} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-colors">
                    <td className="px-8 py-4">
                      <div className="font-black text-[#1E293B] text-sm">{order.orderNum}</div>
                      {order.cjOrderId && (
                        <div className="text-xs text-[#64748B] mt-0.5">CJ: {order.cjOrderId}</div>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <div className="font-semibold text-[#1E293B] text-sm">{order.customerName || '-'}</div>
                      {order.customerPhone && (
                        <div className="text-xs text-[#64748B] mt-0.5">{order.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      {order.trackingNumber ? (
                        <div className="flex items-center gap-2">
                          <code className="text-[12px] font-bold text-[#1E293B] bg-[#F1F5F9] px-2 py-1 rounded">
                            {order.trackingNumber}
                          </code>
                          <a
                            href={`https://www.17track.net/en/track?nums=${order.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FF6B00] hover:underline text-xs font-bold"
                          >
                            <i className="fas fa-external-link-alt" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] text-xs font-semibold">Not available yet</span>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold uppercase tracking-[0.05em] ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        <i className={`fas ${STATUS_ICONS[order.status] || 'fa-circle'} text-[8px]`} />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-xs font-bold text-[#64748B]">
                        {new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
