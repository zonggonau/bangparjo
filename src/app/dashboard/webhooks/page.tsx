import { prisma } from '@/lib/db';
import { 
  Activity, 
  Terminal, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  Package, 
  ShoppingCart, 
  Database,
  Eye,
  Clock
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function WebhookLogsPage() {
  const logs = await prisma.webhookLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">Signal Monitor</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Interpreting real-time transmissions from global supplier nodes.</p>
        </div>
        <button className="px-6 py-3 bg-white/5 border border-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-all flex items-center gap-2">
          <RefreshCcw size={14} /> Re-Sync
        </button>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
        <div className="px-12 py-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Transmission History</span>
            <h2 className="text-sm font-black text-white uppercase italic tracking-tight">{logs.length} Recent Packets</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Nexus Online</span>
          </div>
        </div>
        
        {logs.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center text-center px-12">
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 mb-8">
              <Terminal size={40} />
            </div>
            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">No Transmissions</h4>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Listening for supplier signals on established frequencies.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/20">
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Packet Type</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Timestamp</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Logic State</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Payload Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {logs.map(log => (
                  <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                        log.eventType === 'STOCK' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
                        log.eventType === 'ORDER' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 
                        'bg-white/5 border-white/10 text-white/40'
                      }`}>
                        {log.eventType === 'STOCK' ? <Package size={10} /> : log.eventType === 'ORDER' ? <ShoppingCart size={10} /> : <Activity size={10} />}
                        {log.eventType}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-tighter uppercase italic">
                         <Clock size={10} />
                         {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {log.error ? (
                        <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase italic tracking-tight">
                          <XCircle size={12} /> Purge Error
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-400 text-[10px] font-black uppercase italic tracking-tight">
                          <CheckCircle2 size={12} /> Valid Node
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <details className="group/details">
                        <summary className="cursor-pointer text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 outline-none hover:text-white transition-colors">
                          <Eye size={12} /> Inspect Packet
                        </summary>
                        <div className="mt-4 space-y-4">
                          <pre className="p-6 bg-black/40 border border-white/5 rounded-2xl text-[10px] text-white/60 overflow-x-auto custom-scrollbar leading-relaxed">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                          {log.error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                               <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                               <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest leading-relaxed">
                                 {log.error}
                               </span>
                            </div>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

