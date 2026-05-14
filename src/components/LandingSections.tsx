'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import styles from './LandingSections.module.css';

export default function LandingSections() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch produk dari database lokal
    fetch('/api/products/featured')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data?.list) {
          setProducts(res.data.list);
        } else {
          setError('Belum ada produk yang tersedia.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[LandingSections] Error:', err);
        setError('Gagal memuat produk.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Memuat produk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  if (products.length === 0) return null;

  // Pisahkan menjadi 2 grup untuk tampilan seperti sebelumnya
  const mid = Math.ceil(products.length / 2);
  const firstGroup = products.slice(0, mid);
  const secondGroup = products.slice(mid);

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <div className={styles.header}>
          <h2>🔥 Produk Pilihan</h2>
          <p>Produk terbaru yang tersedia di toko kami</p>
        </div>
        <div className={styles.grid}>
          {firstGroup.map((p: any) => <ProductCard key={p.pid} product={p} />)}
        </div>
      </section>

      {secondGroup.length > 0 && (
        <section className={styles.section}>
          <div className={styles.header}>
            <h2>✨ Koleksi Lengkap ✨</h2>
            <p>Jelajahi semua produk yang sudah kami siapkan</p>
          </div>
          <div className={styles.grid}>
            {secondGroup.map((p: any) => <ProductCard key={p.pid} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
