'use client';

import styles from './ProductCard.module.css';

export default function ProductSkeleton() {
  return (
    <div className={`${styles.productCard} ${styles.skeletonCard}`}>
      <div className={styles.imageContainer}>
        <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
      </div>
      <div className={styles.productInfo}>
        <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '8px' }}></div>
        <div className="skeleton" style={{ width: '90%', height: '18px', marginBottom: '4px' }}></div>
        <div className="skeleton" style={{ width: '70%', height: '18px', marginBottom: '12px' }}></div>
        
        <div className={styles.priceRow}>
          <div className="skeleton" style={{ width: '30%', height: '22px' }}></div>
          <div className="skeleton" style={{ width: '20%', height: '16px' }}></div>
        </div>

        <div className={styles.ratingRow} style={{ marginTop: 'auto' }}>
          <div className="skeleton" style={{ width: '40%', height: '14px' }}></div>
          <div className="skeleton" style={{ width: '30%', height: '14px' }}></div>
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="productGrid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container" style={{ padding: '2rem var(--container-padding)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
        {/* Gallery Skeleton */}
        <div>
          <div className="skeleton" style={{ width: '100%', paddingTop: '100%', borderRadius: '0', marginBottom: '1rem' }}></div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ width: '70px', height: '70px', borderRadius: '4px' }}></div>
            ))}
          </div>
        </div>

        {/* Details Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '20px' }}></div>
          <div className="skeleton" style={{ width: '90%', height: '32px' }}></div>
          <div className="skeleton" style={{ width: '40%', height: '18px' }}></div>
          
          <div style={{ background: 'var(--gray-50)', padding: '1.25rem', borderRadius: '12px' }}>
            <div className="skeleton" style={{ width: '60%', height: '36px', marginBottom: '8px' }}></div>
            <div className="skeleton" style={{ width: '40%', height: '18px' }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div className="skeleton" style={{ width: '30%', height: '20px' }}></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ width: '60px', height: '32px', borderRadius: '6px' }}></div>
              ))}
            </div>
          </div>

          <div className="skeleton" style={{ width: '100%', height: '100px', borderRadius: '12px' }}></div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="skeleton" style={{ flex: 1, height: '48px', borderRadius: '12px' }}></div>
            <div className="skeleton" style={{ flex: 1, height: '48px', borderRadius: '12px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

