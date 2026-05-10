import { ProductDetailSkeleton } from '@/components/ProductSkeleton';

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Breadcrumb Skeleton */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0.875rem 0' }}>
        <div className="container">
          <div className="skeleton" style={{ width: '200px', height: '14px' }}></div>
        </div>
      </div>
      
      <ProductDetailSkeleton />
    </div>
  );
}
