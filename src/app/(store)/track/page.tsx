'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  CheckCircle2, 
  Package, 
  Truck, 
  Check, 
  X, 
  ShieldCheck, 
  Globe, 
  RotateCcw,
  ExternalLink,
  Mail,
  Loader2,
  HelpCircle,
  ClipboardList
} from 'lucide-react';

const STATUS_STEPS = [
  { label: 'Order Placed', icon: ClipboardList },
  { label: 'Processing', icon: Package },
  { label: 'Shipped', icon: Truck },
  { label: 'Delivered', icon: CheckCircle2 }
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
      const localRes = await fetch(`/api/orders/track?id=${encodeURIComponent(id)}`);
      const localData = await localRes.json();

      if (localData.success && localData.order) {
        setTrackingData({ source: 'local', ...localData.order });
        setSearched(true);
        return;
      }

      const cjRes = await fetch(`/api/cj-proxy?endpoint=/v1/shopping/order/getOrderDetail?orderId=${encodeURIComponent(id)}`);
      const cjData = await cjRes.json();

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
    <div className="min-h-screen bg-[#07070e] text-[#f0f0f6] pt-32 pb-20">
      <main className="max-w-5xl mx-auto px-6">
        <div className="relative mb-20 text-center">
          {/* Hero Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <Package size={12} /> Real-time Order Tracking
          </div>
          
          <h1 className="font-outfit text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none">
            Track Your<br />
            <span className="bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent italic">Order</span>
          </h1>
          
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Enter your Order ID to instantly see your shipment status, tracking number, and estimated delivery.
          </p>

          {/* Search Form */}
          <form onSubmit={handleTrack} className="relative max-w-2xl mx-auto group">
            <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] focus-within:border-primary/50 transition-all duration-300 shadow-2xl">
              <div className="relative flex-1 flex items-center">
                <Search size={20} className="absolute left-6 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Enter Order ID  (e.g. BUY-1747100000000)"
                  className="w-full bg-transparent py-4 pl-14 pr-6 text-sm font-medium outline-none placeholder:text-gray-600"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                />
                {orderId && (
                  <button
                    type="button"
                    className="p-2 mr-2 text-gray-500 hover:text-white transition-colors"
                    onClick={() => { setOrderId(''); setTrackingData(null); setError(''); setSearched(false); }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <button 
                type="submit" 
                disabled={loading || !orderId.trim()}
                className="bg-primary hover:bg-primary-dark text-black font-black px-8 py-4 rounded-[2rem] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Truck size={20} />}
                {loading ? 'Tracking...' : 'Track Now'}
              </button>
            </div>
          </form>

          {/* Trust line */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary" /> 100% Secure</span>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <span className="flex items-center gap-1.5"><Globe size={14} className="text-primary" /> 200+ Countries</span>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <span className="flex items-center gap-1.5"><RotateCcw size={14} className="text-primary" /> 30-day Returns</span>
          </div>
        </div>

        {/* ERROR */}
        {error && !loading && (
          <div className="max-w-xl mx-auto bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center gap-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
              <X size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="font-bold text-white">Order Not Found</p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {/* RESULT */}
        {trackingData && !loading && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Status Card */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-sm">
              {/* Progress Steps */}
              <div className="relative mb-16 px-4">
                <div className="absolute top-5 left-10 right-10 h-0.5 bg-white/5" />
                <div 
                  className="absolute top-5 left-10 h-0.5 bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,107,53,0.5)]" 
                  style={{ width: `${(statusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
                <div className="relative flex justify-between">
                  {STATUS_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const isDone = i <= statusIndex;
                    const isCurrent = i === statusIndex;
                    
                    return (
                      <div key={step.label} className="flex flex-col items-center gap-4 relative z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                          isDone ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-110' : 'bg-white/5 text-gray-600'
                        }`}>
                          {i < statusIndex ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          isDone ? 'text-white' : 'text-gray-600'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5 mb-8">
                <div>
                   <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${
                     displayStatus.toUpperCase() === 'COMPLETED' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'
                   }`}>
                     {displayStatus.replace(/_/g, ' ')}
                   </div>
                   <h2 className="text-2xl font-bold text-white tracking-tight">Order #{orderId}</h2>
                </div>
                <div className="flex flex-col items-start md:items-end gap-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estimated Delivery</span>
                  <span className="text-lg font-bold text-white">Pending calculation...</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <InfoCard label="📦 Carrier" value={carrier || 'Being assigned...'} />
                <InfoCard 
                  label="🔢 Tracking Number" 
                  value={trackingNumber || 'Pending shipment'} 
                  highlight={!!trackingNumber} 
                />
                <InfoCard 
                  label="📅 Order Date" 
                  value={(trackingData.createDate || trackingData.createdAt) ? new Date(trackingData.createDate || trackingData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} 
                />
              </div>

              {/* Action Button */}
              {trackingNumber && (
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <p className="text-sm text-gray-400">Track on global networks for more details:</p>
                  <a
                    href={`https://www.17track.net/en/result?nums=${trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-3 rounded-2xl transition-all border border-white/10"
                  >
                    <Globe size={18} /> Track on 17TRACK <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {/* Help Support Card */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <Mail size={24} />
                 </div>
                 <div>
                   <p className="font-bold text-white">Need help with your order?</p>
                   <p className="text-sm text-gray-400">Our team is here 24/7 to assist you with any questions.</p>
                 </div>
               </div>
               <a href="mailto:support@bangparjo.shop" className="text-primary font-bold hover:underline underline-offset-8 transition-all">
                 Contact Support →
               </a>
            </div>
          </div>
        )}

        {/* HOW TO GUIDE (only before search) */}
        {!searched && !loading && (
          <div className="mt-32">
            <h2 className="font-outfit text-3xl font-black text-center mb-16 tracking-tight uppercase tracking-[0.2em]">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { n: '1', icon: Mail, title: 'Check Email', desc: 'Find your Order ID in your confirmation email.' },
                { n: '2', icon: Search, title: 'Enter ID', desc: 'Paste the ID into the search field above.' },
                { n: '3', icon: Truck, title: 'Track Live', desc: 'Hit track to see real-time updates.' },
                { n: '4', icon: CheckCircle2, title: 'Delivery', desc: 'Monitor shipment until it reaches you.' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.n} className="group relative p-8 bg-white/5 border border-white/10 rounded-[2rem] transition-all hover:bg-white/10">
                    <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-black font-black flex items-center justify-center rounded-xl shadow-lg shadow-primary/20 transition-transform group-hover:scale-110 group-hover:rotate-6">
                      {s.n}
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 transition-colors">
                       <Icon size={24} />
                    </div>
                    <h3 className="font-bold text-white mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-1">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <span className={`block text-sm font-bold truncate ${highlight ? 'text-primary' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
