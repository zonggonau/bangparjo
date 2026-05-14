'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, Zap } from 'lucide-react';

const MOODS = [
  { label: 'Trending', icon: '🔥', query: 'trending top seller' },
  { label: 'Summer Vibe', icon: '🏖️', query: 'summer beach casual' },
  { label: 'Gamer Setup', icon: '🎮', query: 'rgb gaming tech' },
  { label: 'Classy Elegant', icon: '👗', query: 'elegant luxury jewelry' },
  { label: 'Cozy Home', icon: '🏠', query: 'minimalist home decor' },
];

export default function MoodSearch() {
  const router = useRouter();
  const [customMood, setCustomMood] = useState('');

  const handleMoodClick = (query: string) => {
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  const handleCustomMood = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMood.trim()) {
      let keywords = customMood.trim();
      if (keywords.includes('party')) keywords += ' dress outfit sparkle';
      if (keywords.includes('office')) keywords += ' formal stationery professional';
      
      router.push(`/?q=${encodeURIComponent(keywords)}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-primary animate-pulse" />
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Curated AI Moods</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {MOODS.map((m) => (
          <button 
            key={m.label} 
            className="group flex items-center gap-2 bg-white/5 border border-white/5 rounded-full px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/20 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 shadow-lg"
            onClick={() => handleMoodClick(m.query)}
          >
            <span className="group-hover:scale-125 transition-transform">{m.icon}</span>
            <span className="uppercase tracking-tight">{m.label}</span>
          </button>
        ))}
      </div>

      <form 
        className="relative group bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-primary/50 transition-all shadow-2xl overflow-hidden"
        onSubmit={handleCustomMood}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
        
        <div className="relative z-10 flex items-center gap-3 pl-4">
          <Zap size={18} className="text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Describe your vibe (e.g. 'retro aesthetic tech')..." 
            className="flex-1 bg-transparent border-none py-3 text-sm text-white placeholder:text-white/10 outline-none font-medium"
            value={customMood}
            onChange={e => setCustomMood(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all active:scale-95 flex items-center gap-2"
          >
            <Sparkles size={14} /> AI Discover
          </button>
        </div>
      </form>
    </div>
  );
}

