'use client';

import { useState, useEffect } from 'react';

const RECENT_SALES = [
  { name: 'Michael from New York', product: 'Wireless Earbuds', time: '2 minutes ago', icon: 'fa-headphones' },
  { name: 'Sarah from London', product: 'Premium Skincare Set', time: '5 minutes ago', icon: 'fa-spray-can' },
  { name: 'Ahmad from Dubai', product: 'Smart Watch Series 7', time: '1 minute ago', icon: 'fa-stopwatch' },
  { name: 'Yuki from Tokyo', product: 'Mechanical Keyboard', time: '3 minutes ago', icon: 'fa-keyboard' },
  { name: 'David from Sydney', product: 'Ergonomic Desk Chair', time: '12 minutes ago', icon: 'fa-chair' },
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
      className="fixed-sales-notification"
      style={{ 
        position: 'fixed', 
        bottom: '24px', 
        left: '24px', 
        zIndex: 1000, 
        transition: 'all 0.5s ease',
        transform: isVisible ? 'translateX(0)' : 'translateX(-120%)',
        opacity: isVisible ? 1 : 0
      }}
    >
      <div className="card" style={{ padding: '16px', minWidth: '320px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', background: '#fff', border: '1px solid #eee' }}>
        <div className="flex items-center gap-16">
          <div className="flex-center bg-light" style={{ width: '48px', height: '48px', borderRadius: '12px', fontSize: '20px', color: 'var(--primary)' }}>
            <i className={`fas ${currentSale.icon}`}></i>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>
              <span className="text-primary">{currentSale.name}</span> purchased
            </p>
            <h4 style={{ fontSize: '14px', margin: '0 0 4px', fontWeight: '900' }}>{currentSale.product}</h4>
            <div className="flex items-center gap-8">
              <span className="dot dot-success"></span>
              <p style={{ fontSize: '10px', color: '#aaa', fontWeight: '700', margin: 0 }}>{currentSale.time}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, padding: '4px' }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

