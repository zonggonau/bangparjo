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
    <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-black text-[10px] font-black flex items-center justify-center rounded-full shadow-lg shadow-primary/20 animate-in zoom-in duration-300">
      {totalFavorites}
    </span>
  );
}

