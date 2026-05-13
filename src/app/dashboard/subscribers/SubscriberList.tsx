'use client';

import { useState } from 'react';
import { 
  Download, 
  Trash2, 
  Mail, 
  UserPlus, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Calendar,
  MoreVertical
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date | string;
}

export default function SubscriberList({ initialSubscribers }: { initialSubscribers: Subscriber[] }) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Execute terminal purge for this subscriber?')) return;
    
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubscribers(subscribers.filter(sub => sub.id !== id));
      }
    } catch (err) { alert('CRITICAL: Purge sequence failed.'); } 
    finally { setDeleting(null); }
  };

  const handleExport = () => {
    const csv = [
      ['Email', 'Joined Date', 'Status'],
      ...subscribers.map(sub => [sub.email, new Date(sub.createdAt).toISOString(), sub.isActive ? 'Active' : 'Inactive'])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
      <div className="px-12 py-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Terminal Registry</span>
          <h2 className="text-sm font-black text-white uppercase italic tracking-tight">{subscribers.length} Global Entries</h2>
        </div>
        <button 
          onClick={handleExport} 
          className="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-primary flex items-center gap-2"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {subscribers.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-center px-12">
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 mb-8">
            <Mail size={40} />
          </div>
          <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">No Signal Detected</h4>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">When users interface with the newsletter, they will appear in the vault.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Subscriber Entity</th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Temporal Marker</th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Logic State</th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subscribers.map(sub => (
                <tr key={sub.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-primary transition-colors">
                         <Mail size={16} />
                       </div>
                       <span className="text-xs font-black text-white uppercase italic tracking-tight">{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                       <Calendar size={12} className="text-white/10" />
                       {new Date(sub.createdAt).toLocaleDateString('en-US', {
                         day: 'numeric', month: 'long', year: 'numeric'
                       })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${sub.isActive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {sub.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleDelete(sub.id)}
                      disabled={deleting === sub.id}
                      className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-black transition-all active:scale-95 disabled:opacity-50"
                    >
                      {deleting === sub.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

