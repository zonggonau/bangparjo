'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  Package, 
  Truck, 
  Settings, 
  ArrowUpRight, 
  ArrowRight,
  Download,
  Share2,
  RefreshCw,
  Bell,
  Search,
  ChevronRight,
  Inbox,
  Loader2,
  DollarSign,
  Layers,
  ChevronUp,
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function DashboardPage() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setOrders(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((a, o) => a + Number(o.totalAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'UNPAID').length;
  const shippedOrders = orders.filter(o => o.status === 'SHIPPED').length;
  const paidOrders = orders.filter(o => o.status === 'PAID').length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">System Intelligence</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Real-time terminal for direct-to-consumer logistics.</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             className="px-6 py-3 bg-primary text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
             onClick={async () => {
               if (!confirm('Execute global inventory synchronization?')) return;
               const res = await fetch('/api/cron/inventory');
               const data = await res.json();
               alert(data.success ? `Successfully synchronized ${data.updated} variants.` : 'Sync failure: ' + data.error);
             }}
           >
             <RefreshCw size={14} /> Global Sync
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Gross Revenue" 
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          sub="All-time processed" 
          icon={DollarSign} 
          loading={loading} 
          trend="+12.5%"
          color="primary"
        />
        <StatCard 
          label="Total Volumne" 
          value={orders.length.toString()} 
          sub={`${paidOrders} paid · ${pendingOrders} unpaid`} 
          icon={Package} 
          loading={loading} 
          trend="+5.2%"
          color="white"
        />
        <StatCard 
          label="Active Logistics" 
          value={shippedOrders.toString()} 
          sub="Currently in transit" 
          icon={Truck} 
          loading={loading} 
          color="white"
        />
        <StatCard 
          label="Logic Chains" 
          value={(settings.marginTiers?.length || 0).toString()} 
          sub="Active markup tiers" 
          icon={Layers} 
          loading={loading} 
          color="white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Recent Orders Panel */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Clock size={16} className="text-primary" /> Transmission History
              </h3>
              <Link href="/dashboard/orders" className="text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1 group">
                Full Log <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>

           <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
             {loading ? (
               <div className="py-32 flex flex-col items-center justify-center gap-4">
                 <Loader2 size={32} className="animate-spin text-primary" />
                 <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Decoding ledger...</span>
               </div>
             ) : recentOrders.length === 0 ? (
               <div className="py-32 flex flex-col items-center justify-center text-center px-12">
                 <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/10 mb-6">
                   <Inbox size={32} />
                 </div>
                 <h4 className="text-white font-black uppercase italic tracking-tighter mb-2">No Transmissions Detected</h4>
                 <p className="text-xs text-white/20 font-bold uppercase tracking-widest">The ledger is currently empty. Awaiting first customer sequence.</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-white/5">
                       <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Identity</th>
                       <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Payload</th>
                       <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Status</th>
                       <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Timestamp</th>
                       <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Link</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {recentOrders.map(o => (
                       <tr key={o.id || o.orderNum} className="group hover:bg-white/[0.02] transition-colors">
                         <td className="px-8 py-6">
                           <div className="flex flex-col">
                             <span className="text-xs font-black text-white uppercase italic truncate max-w-[120px]">{o.customerName || 'Anonymous'}</span>
                             <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter truncate max-w-[120px]">{o.orderNum}</span>
                           </div>
                         </td>
                         <td className="px-8 py-6">
                           <span className="text-sm font-black text-primary italic">${Number(o.totalAmount || 0).toFixed(2)}</span>
                         </td>
                         <td className="px-8 py-6">
                           <StatusBadge status={o.status} />
                         </td>
                         <td className="px-8 py-6">
                           <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                             {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                           </span>
                         </td>
                         <td className="px-8 py-6 text-right">
                           <Link href="/dashboard/orders" className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-white/5 border border-white/5 text-white/20 hover:text-white hover:border-primary/20 transition-all group-hover:scale-110">
                             <ChevronRight size={14} />
                           </Link>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>
        </div>

        {/* Quick Commands Panel */}
        <div className="lg:col-span-4 space-y-6">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
             <Zap size={16} className="text-primary" /> Rapid Access
           </h3>
           
           <div className="grid grid-cols-1 gap-4">
             <QuickCommand 
               icon={Download} 
               label="Import Assets" 
               desc="Sync with CJ catalog" 
               href="/dashboard/importer" 
             />
             <QuickCommand 
               icon={Package} 
               label="Fulfillment" 
               desc="Manage active payloads" 
               href="/dashboard/orders" 
             />
             <QuickCommand 
               icon={Share2} 
               label="Social Matrix" 
               desc="Automatic broadcasting" 
               href="/dashboard/social" 
             />
             <QuickCommand 
               icon={Settings} 
               label="Logic Tiers" 
               desc="Adjust markup margins" 
               href="/dashboard/settings" 
             />
             <QuickCommand 
               icon={RefreshCw} 
               label="Sync Nodes" 
               desc="Manual inventory update" 
               onClick={async () => {
                 if (!confirm('Execute node synchronization?')) return;
                 const res = await fetch('/api/cron/inventory');
                 const data = await res.json();
                 alert(data.success ? `Synced ${data.updated} variants.` : 'Failure: ' + data.error);
               }}
             />
             <QuickCommand 
               icon={Bell} 
               label="Signals" 
               desc="Webhook event history" 
               href="/dashboard/webhooks" 
             />
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, loading, trend, color }: any) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-4 hover:border-primary/20 transition-all group relative overflow-hidden backdrop-blur-xl shadow-2xl">
      {color === 'primary' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
      )}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-white/40 transition-colors">{label}</span>
        <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center ${color === 'primary' ? 'text-primary border-primary/20 bg-primary/10' : 'text-white/20 group-hover:text-white group-hover:border-white/20 transition-all'}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="space-y-1 relative z-10">
        <div className="text-3xl font-black text-white tracking-tighter uppercase italic group-hover:scale-105 transition-transform origin-left duration-500">
          {loading ? <div className="w-24 h-8 bg-white/5 animate-pulse rounded-lg" /> : value}
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <span className="text-[10px] font-black text-green-500 flex items-center gap-0.5">
              <ChevronUp size={10} /> {trend}
            </span>
          )}
          <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">{sub}</span>
        </div>
      </div>
    </div>
  );
}

function QuickCommand({ icon: Icon, label, desc, href, onClick }: any) {
  const inner = (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-5 hover:border-primary/30 hover:bg-white/[0.08] transition-all group cursor-pointer backdrop-blur-md">
      <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:scale-110 transition-all duration-300">
        <Icon size={24} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">{label}</span>
        <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] truncate">{desc}</span>
      </div>
      <ChevronRight size={14} className="ml-auto text-white/10 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </div>
  );

  if (onClick) return <div onClick={onClick}>{inner}</div>;
  return <Link href={href!} className="block no-underline">{inner}</Link>;
}

export function StatusBadge({ status }: { status: string }) {
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

