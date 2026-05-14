import { prisma } from '@/lib/db';
import SubscriberList from './SubscriberList';
import { Mail, UserCheck, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const total = subscribers.length;
  const active = subscribers.filter(s => s.isActive).length;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">Audience Matrix</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Managing high-conversion email marketing subscribers.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white/5 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl group hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Total Audience</span>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-all">
              <Users size={20} />
            </div>
          </div>
          <div className="text-5xl font-black text-white italic tracking-tighter">{total}</div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Global Reach</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl group hover:border-green-500/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Verified Active</span>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-green-400 group-hover:bg-green-500/10 transition-all">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="text-5xl font-black text-green-400 italic tracking-tighter text-glow-green">{active}</div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Confirmed Logic</span>
          </div>
        </div>
      </div>

      <SubscriberList initialSubscribers={JSON.parse(JSON.stringify(subscribers))} />
    </div>
  );
}

