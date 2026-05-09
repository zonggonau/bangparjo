'use client';

import { useState, useEffect } from 'react';
import styles from './CartCounter.module.css';

export default function FavoriteCounter() {
  const [totalFavorites, setTotalFavorites] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const validFavs = favs.filter((f: any) => typeof f === 'object' && f !== null && f.pid);
      setTotalFavorites(validFavs.length);
      
      // Auto cleanup corrupted/string favorites
      if (validFavs.length !== favs.length) {
        localStorage.setItem('favorites', JSON.stringify(validFavs));
      }
    };

    updateCount();

    window.addEventListener('favoritesUpdated', updateCount);
    // Also listen to storage events across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'favorites') updateCount();
    });

    return () => {
      window.removeEventListener('favoritesUpdated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  if (totalFavorites === 0) return null;

  return <span className={styles.counter}>{totalFavorites}</span>;
}
