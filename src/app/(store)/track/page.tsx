'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cjProxyAction } from '@/lib/actions-catalog';
import { trackOrderAction } from '@/lib/actions-user';

const STATUS_STEPS = [
  { label: 'Order Placed', icon: 'fa-clipboard-list' },
  { label: 'Processing', icon: 'fa-box' },
  { label: 'Shipped', icon: 'fa-truck' },
  { label: 'Delivered', icon: 'fa-check-circle' }
];

const STATUS_MAP: Record<string, number> = {
  CREATED: 0, UNPAID: 0,
  PROCESSING: 1, PAID: 1,
  SHIPPED: 2,
  COMPLETED: 3, DELIVERED: 3,
};

export default function TrackPage() {
  const [orderId, setOrderId] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) return;

    setLoading(true);
    setError('');
    setTrackingData(null);
    setSearched(false);

    try {
      const localData = await trackOrderAction(id);

      if (localData.success && localData.order) {
        setTrackingData({ source: 'local', ...localData.order });
        setSearched(true);
        return;
      }

      const cjData = await cjProxyAction(`/v1/shopping/order/getOrderDetail?orderId=${encodeURIComponent(id)}`);

      if (cjData.success && cjData.data) {
        setTrackingData({ source: 'cj', ...cjData.data });
      } else {
        setError('Order not found. Please check your Order ID and try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const statusIndex = trackingData
    ? STATUS_MAP[trackingData.status?.toUpperCase() || trackingData.orderStatus?.toUpperCase() || 'CREATED'] ?? 0
    : 0;

  const displayStatus =
    trackingData?.status || trackingData?.orderStatus || 'Processing';

  const trackingNumber =
    trackingData?.trackingNumber || trackingData?.trackNumber || null;

  const carrier =
    trackingData?.logisticName || trackingData?.logistic || null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6">
             <i className="fas fa-box-open text-[#FF6B00]"></i>
             <span className="text-[#FF6B00] font-bold text-xs tracking-[0.2em] uppercase">Real-time Order Tracking</span>
          </div>
          <h1 className="text-[48px] font-black text-[#1A1A1A] mb-4">Track Your <span className="text-[#FF6B00]">Order</span></h1>
          <p className="text-gray-500 max-w-[500px] mx-auto mb-8">Enter your Order ID to instantly see your shipment status, tracking number, and estimated delivery.</p>
          
          <form onSubmit={handleTrack} className="flex max-w-[500px] mx-auto rounded-[50px] overflow-hidden border-2 border-[#FF6B00]">
            <input
              type="text"
              placeholder="Enter Order ID  (e.g. BUY-1747100000000)"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              className="flex-1 px-6 py-4 bg-white text-sm text-[#1A1A1A] placeholder:text-gray-500 outline-none border-none"
            />
            <button type="submit" disabled={loading || !orderId.trim()} className="px-8 py-4 bg-[#FF6B00] text-white font-semibold text-sm cursor-pointer transition-all duration-300 border-none hover:bg-[#E06000] disabled:opacity-50">
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
              {loading ? ' Tracking...' : ' Track Now'}
            </button>
          </form>

          <div className="flex justify-center gap-6 mt-8 flex-wrap">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-[1px]"><i className="fas fa-shield-alt text-[#FF6B00]"></i> 100% Secure</span>
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-[1px]"><i className="fas fa-globe text-[#FF6B00]"></i> 200+ Countries</span>
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-[1px]"><i className="fas fa-undo text-[#FF6B00]"></i> 30-day Returns</span>
          </div>
        </div>

        {/* ERROR */}
        {error && !loading && (
          <div className="bg-white rounded-[10px] max-w-[600px] mx-auto mb-12 border-l-4 border-red-500 bg-red-50">
            <div className="p-5 flex items-center gap-4">
              <i className="fas fa-exclamation-circle text-red-500 text-2xl"></i>
              <div>
                <h4 className="m-0 text-red-500 font-bold">Order Not Found</h4>
                <p className="m-0 text-sm opacity-80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {trackingData && !loading && (
          <div className="max-w-[800px] mx-auto">
            <div className="bg-white rounded-[10px] border border-gray-200 mb-8">
              <div className="p-6">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#FF6B00] mb-2">{displayStatus.replace(/_/g, ' ')}</span>
                    <h2 className="m-0 text-[#1A1A1A]">Order #{orderId}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-500 font-bold uppercase m-0">Estimated Delivery</p>
                    <p className="text-lg font-bold m-0 text-[#1A1A1A]">Pending...</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step.label} className={`flex items-center gap-4 ${i <= statusIndex ? '' : 'opacity-40'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${i <= statusIndex ? 'bg-[#FF6B00] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        <i className={`fas ${step.icon}`}></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1A1A1A] m-0">{step.label}</h4>
                        <p className="text-sm text-gray-500 m-0">{i <= statusIndex ? 'Step completed' : 'Awaiting processing'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-200">
                  <div>
                    <p className="text-[11px] text-gray-500 font-bold uppercase mb-2">📦 Carrier</p>
                    <p className="font-bold m-0 text-[#1A1A1A]">{carrier || 'Assigning...'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 font-bold uppercase mb-2">🔢 Tracking Number</p>
                    <p className={`font-bold m-0 ${trackingNumber ? 'text-[#FF6B00]' : 'text-[#1A1A1A]'}`}>{trackingNumber || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 font-bold uppercase mb-2">📅 Order Date</p>
                    <p className="font-bold m-0 text-[#1A1A1A]">{(trackingData.createDate || trackingData.createdAt) ? new Date(trackingData.createDate || trackingData.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                {trackingNumber && (
                  <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-500 mb-4">Track on global networks for more details:</p>
                    <a
                      href={`https://www.17track.net/en/result?nums=${trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-2.5 rounded-md font-semibold border border-gray-200 text-[#1A1A1A] hover:bg-gray-50 transition-all duration-200"
                    >
                      <i className="fas fa-globe"></i> Track on 17TRACK <i className="fas fa-external-link-alt text-xs ml-1"></i>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-orange-50 rounded-[10px] border border-orange-200">
              <div className="p-6 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-white text-[#FF6B00]">
                    <i className="fas fa-envelope-open-text text-2xl"></i>
                  </div>
                  <div>
                    <h4 className="m-0 font-bold text-[#1A1A1A]">Need help with your order?</h4>
                    <p className="m-0 text-sm text-gray-500">Our team is here 24/7 to assist you.</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '628219105980'}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold bg-[#25D366] text-white hover:bg-[#1DAF56] transition-all duration-200">
                    <i className="fab fa-whatsapp"></i> WhatsApp
                  </a>
                  <a href="mailto:support@bangparjo.shop" className="inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200">Contact Support</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HOW TO GUIDE */}
        {!searched && !loading && (
          <div className="mt-20">
            <h2 className="text-center mb-12 uppercase tracking-[0.2em] text-[#1A1A1A] font-bold">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { n: '1', icon: 'fa-envelope', title: 'Check Email', desc: 'Find your Order ID in your confirmation email.' },
                { n: '2', icon: 'fa-search', title: 'Enter ID', desc: 'Paste the ID into the search field above.' },
                { n: '3', icon: 'fa-truck', title: 'Track Live', desc: 'Hit track to see real-time updates.' },
                { n: '4', icon: 'fa-check-circle', title: 'Delivery', desc: 'Monitor shipment until it reaches you.' },
              ].map(s => (
                <div key={s.n} className="bg-white rounded-[10px] border border-gray-200 text-center p-6 relative transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mx-auto mb-6 text-2xl text-[#FF6B00]">
                    <i className={`fas ${s.icon}`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 m-0">{s.desc}</p>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FF6B00] text-white rounded-full font-bold flex items-center justify-center text-sm">{s.n}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
