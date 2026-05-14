'use client';

import { useState } from 'react';
import { 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Instagram, 
  Zap, 
  Rocket, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ShieldCheck,
  Terminal,
  Loader2,
  ChevronRight
} from 'lucide-react';

export default function SocialPosterPage() {
  const [triggering, setTriggering] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const triggerCron = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/cron/social-post', {
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev'}` }
      });
      const data = await res.json();
      
      const newLog = {
        time: new Date().toLocaleString(),
        status: res.ok ? 'SUCCESS' : 'ERROR',
        message: data.message || JSON.stringify(data)
      };
      
      setLogs(prev => [newLog, ...prev]);
      // alert(res.ok ? 'Nexus Broadcaster executed successfully.' : 'Transmission failure.');
    } catch (err: any) {
      setLogs(prev => [{ time: new Date().toLocaleString(), status: 'ERROR', message: err.message }, ...prev]);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">Nexus Broadcaster</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Autonomous product propagation across global social nodes.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
           <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Automation Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl group hover:border-blue-500/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Meta Network</span>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
              <Facebook size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white italic tracking-tighter mb-1 uppercase">Active</div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-blue-400/60 uppercase tracking-widest">
            <ShieldCheck size={10} /> Graph API Validated
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">X Protocol</span>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all">
              <Twitter size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white italic tracking-tighter mb-1 uppercase">Active</div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest">
            <ShieldCheck size={10} /> OAuth 1.0a Secure
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl group hover:border-green-500/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">WhatsApp Node</span>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-green-400 group-hover:bg-green-500/10 transition-all">
              <MessageCircle size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white italic tracking-tighter mb-1 uppercase">Active</div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-green-400/60 uppercase tracking-widest">
            <ShieldCheck size={10} /> Cloud API Linked
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Manual Control */}
        <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl flex flex-col">
          <div className="px-12 py-10 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <Zap size={20} className="text-primary" /> Command Terminal
            </h3>
          </div>
          <div className="p-12 space-y-8 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
               <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed italic">
                 The social engine autonomously selects high-intent products, generates multi-lingual AI captions, and propagates them across the nexus.
               </p>
               <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-relaxed">
                   CRON: Standard frequency is hourly. Manual override forces immediate transmission.
                 </p>
               </div>
            </div>
            
            <button 
              onClick={triggerCron} 
              disabled={triggering}
              className="w-full py-6 bg-white text-black rounded-2xl font-black uppercase italic tracking-[0.2em] transition-all hover:bg-primary active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {triggering ? <Loader2 size={24} className="animate-spin" /> : <Rocket size={24} />}
              {triggering ? 'Transmitting...' : 'Initialize Propagation'}
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
          <div className="px-12 py-10 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <Terminal size={20} className="text-primary" /> Incident Log
            </h3>
          </div>
          
          {logs.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center px-12">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/10 mb-6">
                <Activity size={32} />
              </div>
              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter mb-1 text-white/20">No Session Activity</h4>
              <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest italic">Manual overrides will be logged in this terminal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20">
                    <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Temporal Marker</th>
                    <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">State</th>
                    <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Message Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {logs.map((log, idx) => (
                    <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-white/40 text-[9px] font-bold tracking-tighter uppercase italic">
                           <Clock size={10} /> {log.time}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${log.status === 'SUCCESS' ? 'text-green-400' : 'text-red-500'}`}>
                          {log.status === 'SUCCESS' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {log.status}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] text-white/60 uppercase tracking-tight line-clamp-1 italic">{log.message}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

