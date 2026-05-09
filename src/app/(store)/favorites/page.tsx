'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load favorites from local storage
    const loadFavorites = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('favorites') || '[]');
        // Filter out strings (old format) to only show the newly formatted objects
        const validFavorites = stored.filter((f: any) => typeof f === 'object' && f !== null && f.pid);
        setFavorites(validFavorites);
        
        if (validFavorites.length !== stored.length) {
          localStorage.setItem('favorites', JSON.stringify(validFavorites));
          window.dispatchEvent(new Event('favoritesUpdated'));
        }
      } catch (e) {
        console.error('Failed to parse favorites', e);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();

    // Listen to updates from other tabs or components
    window.addEventListener('favoritesUpdated', loadFavorites);
    window.addEventListener('storage', (e) => {
      if (e.key === 'favorites') loadFavorites();
    });

    return () => {
      window.removeEventListener('favoritesUpdated', loadFavorites);
      window.removeEventListener('storage', loadFavorites);
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          Loading your favorites...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Your Favorites</h1>
          <p className={styles.subtitle}>
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>♥</div>
            <h2 className={styles.emptyTitle}>No favorites yet</h2>
            <p className={styles.emptyDesc}>
              You haven&apos;t added any products to your favorites. Browse our collection and click the heart icon to save items you love!
            </p>
            <Link href="/" className={styles.browseBtn}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="productGrid">
            {favorites.map((product) => (
              <ProductCard key={product.pid} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
