'use client';

import { useState, useEffect } from 'react';
import { getProducts, parseProductName, parseProductImage, formatIDR } from '@/lib/cj-api';
import ProductCard from '@/components/ProductCard';
import styles from './LandingSections.module.css';

export default function LandingSections() {
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Best Sellers (Trending)
    getProducts({ pageSize: 4, keyWord: 'trending' }).then(res => {
      if (res.success) setBestSellers(res.data.list);
    });

    // Fetch New Arrivals
    getProducts({ pageSize: 4, keyWord: '2024 new' }).then(res => {
      if (res.success) setNewArrivals(res.data.list);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <div className={styles.header}>
          <h2>🔥 Best Sellers</h2>
          <p>Top trending products picked by our AI</p>
        </div>
        <div className={styles.grid}>
          {bestSellers.map(p => <ProductCard key={p.pid} product={p} />)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.header}>
          <h2>✨ AI Picks: New Arrivals</h2>
          <p>Freshly added items to the global catalog</p>
        </div>
        <div className={styles.grid}>
          {newArrivals.map(p => <ProductCard key={p.pid} product={p} />)}
        </div>
      </section>
    </div>
  );
}
