import { getDisputeList } from '@/lib/cj-api';
import { prisma } from '@/lib/db';
import { 
  Headphones, 
  Scale, 
  MessageSquare, 
  Clock, 
  User, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  // 1. Fetch CJ Disputes
  const res = await getDisputeList({ pageNum: 1, pageSize: 10 });
  const disputes = res.success && res.data ? res.data.list || [] : [];

  // 2. Fetch Local Customer Tickets
  let tickets: any[] = [];
  try {
    tickets = await (prisma as any).supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  } catch {
    tickets = await prisma.$queryRaw`SELECT * FROM "SupportTicket" ORDER BY "createdAt" DESC LIMIT 20`;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">Resolution Center</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Interfacing between customer satisfaction and supplier integrity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Customer Tickets Section */}
        <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl h-fit">
          <div className="px-12 py-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <Headphones size={20} className="text-primary" /> Customer Inquiries
            </h3>
            <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest">
              {tickets.length} Recent
            </span>
          </div>
          
          {tickets.length > 0 ? (
            <div className="divide-y divide-white/5">
              {tickets.map((t: any) => (
                <div key={t.id} className="p-10 group hover:bg-white/[0.02] transition-colors relative overflow-hidden">
                  <div className="flex items-start justify-between gap-6 mb-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">{t.subject}</h4>
                      <div className="flex items-center gap-3 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                         <span className="flex items-center gap-1"><User size={10} /> {t.name}</span>
                         <span className="w-1 h-1 rounded-full bg-white/10" />
                         <span className="flex items-center gap-1"><Clock size={10} /> {new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${t.status === 'OPEN' ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-lg shadow-red-500/5 animate-pulse' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                      {t.status}
                    </div>
                  </div>
                  
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-relaxed mb-6 line-clamp-2 italic">
                    {t.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-white/10 uppercase tracking-tighter">{t.email}</span>
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                      Open Terminal <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center px-12">
              <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 mb-8">
                <MessageSquare size={40} />
              </div>
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">No Active Tickets</h4>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Customer signals are currently clear.</p>
            </div>
          )}
        </div>

        {/* CJ Disputes Section */}
        <div className="space-y-12">
          <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl h-fit">
            <div className="px-12 py-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                <Scale size={20} className="text-primary" /> Supplier Disputes
              </h3>
              <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest">
                CJ Dropshipping Network
              </span>
            </div>
            
            {disputes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/20">
                      <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Order Node</th>
                      <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Incident Log</th>
                      <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Protocol State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {disputes.map((d: any) => (
                      <tr key={d.disputeId} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                           <span className="text-[10px] font-black text-primary uppercase italic tracking-tighter">{d.orderId}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-xs font-black text-white uppercase italic tracking-tight leading-relaxed">{d.disputeReason}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest inline-block">
                            {d.statusName}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-center px-12">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 mb-8">
                  <FileText size={40} />
                </div>
                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">No Active Disputes</h4>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Supplier integrity is within normal parameters.</p>
              </div>
            )}
          </div>
          
          <div className="p-10 bg-primary/5 border border-primary/10 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
              <Info size={120} />
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <AlertCircle size={28} />
            </div>
            <div className="space-y-2 relative z-10">
              <h5 className="text-xs font-black text-white uppercase tracking-widest">Protocol Intelligence: Disputes</h5>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed italic max-w-lg">
                Always inject high-resolution photographic evidence of shipping labels and terminal assets when initiating a dispute sequence to accelerate settlement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

