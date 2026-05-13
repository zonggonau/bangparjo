'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';

const RECENT_SALES = [
  { name: 'Michael from New York', product: 'Wireless Earbuds', time: '2 minutes ago', icon: '🎧' },
  { name: 'Sarah from London', product: 'Premium Skincare Set', time: '5 minutes ago', icon: '💄' },
  { name: 'Ahmad from Dubai', product: 'Smart Watch Series 7', time: '1 minute ago', icon: '⌚' },
  { name: 'Elena from Madrid', product: 'Boho Summer Dress', time: '8 minutes ago', icon: '👗' },
  { name: 'Yuki from Tokyo', product: 'Mechanical Keyboard', time: '3 minutes ago', icon: '⌨️' },
  { name: 'David from Sydney', product: 'Ergonomic Desk Chair', time: '12 minutes ago', icon: '🪑' },
];

export default function LiveSales() {
  const [currentSale, setCurrentSale] = useState<typeof RECENT_SALES[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showRandomSale = () => {
      const randomIdx = Math.floor(Math.random() * RECENT_SALES.length);
      setCurrentSale(RECENT_SALES[randomIdx]);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    const initialTimer = setTimeout(showRandomSale, 10000);
    const interval = setInterval(() => {
      showRandomSale();
    }, Math.random() * 10000 + 25000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (!currentSale) return null;

  return (
    <div 
      className={`fixed bottom-6 left-6 z-[100] transition-all duration-700 ease-out ${
        isVisible ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] shadow-2xl flex items-center gap-5 min-w-[320px] group relative overflow-hidden">
        {/* Animated Progress Bar */}
        {isVisible && (
          <div className="absolute bottom-0 left-0 h-1 bg-primary animate-progress" />
        )}
        
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
          {currentSale.icon}
        </div>

        <div className="flex-1">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
            <span className="text-primary">{currentSale.name}</span> purchased
          </p>
          <p className="text-sm font-black text-white leading-none mb-1.5 uppercase italic tracking-tighter">
            {currentSale.product}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{currentSale.time}</p>
          </div>
        </div>

        <button 
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white transition-colors"
          onClick={() => setIsVisible(false)}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

