'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Filter, 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  Clock,
  MoreVertical,
  ChevronRight,
  Inbox,
  Globe,
  Database
} from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const s = (status || 'PENDING').toUpperCase();
  
  const styles = {
    PAID: 'bg-green-500/10 border-green-500/20 text-green-500',
    FULFILLED: 'bg-green-500/10 border-green-500/20 text-green-500',
    COMPLETED: 'bg-green-500/10 border-green-500/20 text-green-500',
    DELIVERED: 'bg-green-500/10 border-green-500/20 text-green-500',
    SHIPPED: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    UNPAID: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    PENDING: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    CANCELLED: 'bg-red-500/10 border-red-500/20 text-red-500',
    FAILED: 'bg-red-500/10 border-red-500/20 text-red-500',
    DEFAULT: 'bg-white/5 border-white/10 text-white/20'
  };

  const currentStyle = styles[s as keyof typeof styles] || styles.DEFAULT;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${currentStyle}`}>
      {s === 'PAID' && <CheckCircle2 size={10} className="mr-1.5" />}
      {s === 'SHIPPED' && <Truck size={10} className="mr-1.5" />}
      {s}
    </span>
  );
}

export default function OrdersPage() {
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [cjOrders, setCjOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'LOCAL' | 'CJ'>('LOCAL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    if (source === 'CJ') {
      fetch('/api/cj-orders?pageNum=1&pageSize=50')
        .then(r => r.json())
        .then(d => { if (d.data?.list) setCjOrders(d.data.list); })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      fetch('/api/admin/orders')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setLocalOrders(d); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchOrders(); }, [source]); // eslint-disable-line

  const handleFulfill = async (orderNum: string) => {
    if (!confirm(`Initialize fulfillment sequence for order ${orderNum} to CJ terminal?`)) return;
    setBusy(orderNum);
    try {
      const res = await fetch('/api/admin/orders/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNum }),
      });
      const data = await res.json();
      if (data.success) { alert('Fulfillment sequence initialized successfully.'); fetchOrders(); }
      else alert('Sequence failure: ' + data.error);
    } catch (e: any) { alert('Critical error: ' + e.message); }
    finally { setBusy(null); }
  };

  const handleSync = async (orderNum: string) => {
    setBusy(orderNum);
    try {
      const res = await fetch(`/api/admin/orders/sync?orderNum=${orderNum}`);
      const data = await res.json();
      if (data.success) { alert('Status synchronization complete: ' + data.status); fetchOrders(); }
      else alert('Sync failure: ' + data.error);
    } catch (e: any) { alert('Critical error: ' + e.message); }
    finally { setBusy(null); }
  };

  const rawList = source === 'CJ' ? cjOrders : localOrders;

  const filtered = rawList.filter(o => {
    const matchStatus = statusFilter === 'ALL' || (o.status || o.orderStatus || '').toUpperCase() === statusFilter;
    const term = search.toLowerCase();
    const matchSearch = !term || (o.orderNum || o.orderId || '').toLowerCase().includes(term)
      || (o.customerName || o.shippingCustomerName || '').toLowerCase().includes(term)
      || (o.customerEmail || '').toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const STATUSES = ['ALL', 'UNPAID', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">Logistics Terminal</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Operational control for store and global payloads.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
             onClick={fetchOrders}
           >
             <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Ledger
           </button>
        </div>
      </div>

      {/* Controls Area */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Source Toggle */}
            <div className="bg-white/5 border border-white/5 p-1.5 rounded-2xl flex items-center gap-1">
              <button 
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${source === 'LOCAL' ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-white/20 hover:text-white'}`}
                onClick={() => setSource('LOCAL')}
              >
                <div className="flex items-center gap-2">
                  <Database size={12} /> Store Core
                </div>
              </button>
              <button 
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${source === 'CJ' ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-white/20 hover:text-white'}`}
                onClick={() => setSource('CJ')}
              >
                <div className="flex items-center gap-2">
                  <Globe size={12} /> CJ Network
                </div>
              </button>
            </div>

            {/* Status Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {STATUSES.map(st => (
                <button 
                  key={st} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === st ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/20 hover:text-white hover:border-white/20'}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="w-full lg:w-80 relative group">
            <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-primary transition-colors">
              <Search size={16} />
            </div>
            <input 
              className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-3.5 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-all"
              placeholder="Search IDs, Names, Emails..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl relative">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/20">
           <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
             <Filter size={14} className="text-primary" /> 
             {filtered.length} Payloads Detected
             {statusFilter !== 'ALL' && <span className="text-primary"> // {statusFilter}</span>}
           </h3>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
            <Loader2 size={40} className="animate-spin text-primary" />
            <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em] animate-pulse">Syncing logistics array...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center text-center px-12">
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 mb-8">
              <Inbox size={40} />
            </div>
            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Zero Result Pattern</h4>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Modify your search parameters or filter stack.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Identity</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Customer Terminal</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Payload Value</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Status</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Tracking ID</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Timestamp</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Execute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(o => {
                  const orderId = o.orderNum || o.orderId;
                  const isBusy = busy === orderId;
                  return (
                    <tr key={o.id || orderId} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-primary uppercase italic tracking-tight">{orderId}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white uppercase italic truncate max-w-[180px]">{o.customerName || o.shippingCustomerName || 'Anonymous'}</span>
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter truncate max-w-[180px]">{o.customerEmail || 'No Email'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-white italic tracking-tight">${Number(o.totalAmount || o.orderAmount || 0).toFixed(2)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={o.status || o.orderStatus} />
                      </td>
                      <td className="px-8 py-6">
                        {o.trackingNumber ? (
                          <a 
                            href={`https://www.17track.net/en/result?nums=${o.trackingNumber}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-primary transition-colors group/track"
                          >
                            <span className="font-mono tracking-tighter">{o.trackingNumber}</span>
                            <ExternalLink size={10} className="group-hover/track:translate-x-0.5 group-hover/track:-translate-y-0.5 transition-transform" />
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest italic">— pending</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest whitespace-nowrap">
                           {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {source === 'LOCAL' && (o.status || '').toUpperCase() === 'PAID' && !o.cjOrderId && (
                             <button 
                               className="px-4 py-2 bg-green-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-green-500/10" 
                               disabled={isBusy} 
                               onClick={() => handleFulfill(o.orderNum)}
                             >
                               {isBusy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Fulfill
                             </button>
                           )}
                           {o.cjOrderId && (
                             <button 
                               className="px-4 py-2 bg-white/5 border border-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-primary/20 transition-all disabled:opacity-50 flex items-center gap-2" 
                               disabled={isBusy} 
                               onClick={() => handleSync(o.orderNum)}
                             >
                               {isBusy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Sync
                             </button>
                           )}
                           <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/10 hover:text-white transition-all">
                             <MoreVertical size={14} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

