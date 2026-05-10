'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CJProduct, parseProductName, parseProductImage, slugify } from '@/lib/cj-api';
import { calculateFinalPrice } from '@/lib/pricing';
import { useSettings } from '@/context/SettingsContext';
import styles from './ProductCard.module.css';

function formatUSD(price: number | string): string {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(p)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(p);
}

export default function ProductCard({ product, priority = false }: { product: CJProduct, priority?: boolean }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favs.some((f: any) => (typeof f === 'string' ? f === product.pid : f.pid === product.pid)));
  }, [product.pid]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    let nextFavs;
    const isCurrentlyFav = favs.some((f: any) => (typeof f === 'string' ? f === product.pid : f.pid === product.pid));

    if (!isCurrentlyFav) {
      const favProduct = {
        pid: product.pid,
        productName: product.productName,
        productNameEn: product.productNameEn,
        bigImage: product.bigImage,
        productImage: product.productImage,
        sellPrice: product.sellPrice,
        categoryName: product.categoryName
      };
      nextFavs = [...favs, favProduct];
    } else {
      nextFavs = favs.filter((f: any) => (typeof f === 'string' ? f !== product.pid : f.pid !== product.pid));
    }

    localStorage.setItem('favorites', JSON.stringify(nextFavs));
    setIsFavorite(!isCurrentlyFav);
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const displayName = parseProductName(product.productNameEn || product.productName);
  const prettySlug = slugify(displayName);
  const productUrl = `/product/${product.pid}/${prettySlug}`;

  const productImage = parseProductImage(product.bigImage || product.productImage);
  const originalCjPrice = typeof product.sellPrice === 'number' ? product.sellPrice : parseFloat(String(product.sellPrice));
  const finalPrice = calculateFinalPrice(originalCjPrice, settings);
  
  // Deterministic discount based on PID — same on server and client (no hydration mismatch)
  const discountPct = (product.pid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 21) + 10;

  return (
    <div className={styles.productCard}>
      {/* Badge */}
      <div className={styles.badgeRow}>
        <span className={styles.discountBadge}>-{discountPct}%</span>
        <button 
          className={styles.wishlistBtn} 
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{ color: isFavorite ? '#ef4444' : 'inherit', fontSize: '1.2rem' }}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>

      {/* Image */}
      <Link href={productUrl} className={styles.imageContainer}>
        <Image
          src={productImage}
          alt={displayName}
          fill
          sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className={styles.productImage}
          unoptimized
          priority={priority}
        />
        <div className={styles.imageOverlay}>
          <span className={styles.quickView}>👁 Quick View</span>
        </div>
      </Link>

      {/* Info */}
      <div className={styles.productInfo}>
        <Link 
          href={`/?q=${encodeURIComponent(product.categoryName)}`} 
          className={styles.categoryTag}
          style={{ textDecoration: 'none' }}
        >
          {product.categoryName}
        </Link>
        <Link href={productUrl}>
          <h3 className={styles.productName}>{displayName}</h3>
        </Link>

        <div className={styles.priceRow}>
          <span className={styles.productPrice}>{formatUSD(finalPrice)}</span>
          <span className={styles.originalPrice}>{formatUSD(finalPrice * (1 + discountPct / 100))}</span>
        </div>

        <div className={styles.ratingRow}>
          <div className={styles.starsWrapper}>
            <span className={styles.stars}>
              {'★'.repeat(Math.floor((parseInt(product.pid.slice(-1), 16) % 2) + 4))}
              {'☆'.repeat(5 - Math.floor((parseInt(product.pid.slice(-1), 16) % 2) + 4))}
            </span>
            <span className={styles.reviewCount}>({(parseInt(product.pid.slice(-3), 16) % 400) + 50})</span>
          </div>
          <span className={styles.soldCount}>{(parseInt(product.pid.slice(-2), 16) % 1000) + 100}+ sold</span>
        </div>
      </div>
    </div>
  );
}
