'use client';

import { useState, useEffect } from 'react';

export default function FavoriteCounter() {
  const [totalFavorites, setTotalFavorites] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const validFavs = favs.filter((f: any) => typeof f === 'object' && f !== null && f.pid);
      setTotalFavorites(validFavs.length);
      
      if (validFavs.length !== favs.length) {
        localStorage.setItem('favorites', JSON.stringify(validFavs));
      }
    };

    updateCount();

    window.addEventListener('favoritesUpdated', updateCount);
    window.addEventListener('storage', (e) => {
      if (e.key === 'favorites') updateCount();
    });

    return () => {
      window.removeEventListener('favoritesUpdated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  if (totalFavorites === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1 shadow-sm">
      {totalFavorites > 99 ? '99+' : totalFavorites}
    </span>
  );
}

