'use client';

export default function ProductSkeleton() {
  return (
    <div className="product-card animate-pulse">
      <div className="product-image skeleton aspect-square" />
      <div style={{ padding: '20px' }}>
        <div className="flex items-center gap-8" style={{ marginBottom: '12px' }}>
          <div className="skeleton rounded-full" style={{ height: '12px', width: '60px' }} />
          <div className="skeleton rounded-full" style={{ height: '12px', width: '40px' }} />
        </div>
        <div className="skeleton rounded-lg" style={{ height: '20px', width: '100%', marginBottom: '8px' }} />
        <div className="skeleton rounded-lg" style={{ height: '20px', width: '70%', marginBottom: '16px' }} />
        <div className="flex items-center gap-12" style={{ marginBottom: '16px' }}>
          <div className="skeleton rounded-lg" style={{ height: '28px', width: '80px' }} />
          <div className="skeleton rounded-lg" style={{ height: '16px', width: '50px' }} />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container" style={{ padding: '80px 20px' }}>
      <div className="product-detail-wrapper">
        {/* Gallery Skeleton */}
        <div className="product-gallery">
          <div className="main-image skeleton aspect-square animate-pulse" />
          <div className="thumbnail-list">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="thumbnail-item skeleton aspect-square animate-pulse" />
            ))}
          </div>
        </div>

        {/* Details Skeleton */}
        <div className="flex flex-col gap-24" style={{ padding: '16px 0' }}>
          <div className="space-y-16">
            <div className="skeleton rounded-full" style={{ height: '24px', width: '120px' }} />
            <div className="skeleton rounded-lg" style={{ height: '40px', width: '100%' }} />
            <div className="skeleton rounded-lg" style={{ height: '40px', width: '75%' }} />
          </div>

          <div className="card-body bg-light" style={{ padding: '32px', borderRadius: '24px' }}>
            <div className="skeleton rounded-lg" style={{ height: '40px', width: '160px', marginBottom: '16px' }} />
            <div className="skeleton rounded-lg" style={{ height: '16px', width: '120px' }} />
          </div>

          <div className="product-options" style={{ borderTop: '1px solid #eee', paddingTop: '32px' }}>
            <div className="skeleton rounded-lg" style={{ height: '16px', width: '100px', marginBottom: '16px' }} />
            <div className="flex gap-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton rounded-lg" style={{ height: '40px', width: '60px' }} />
              ))}
            </div>
          </div>

          <div className="skeleton rounded-lg" style={{ height: '120px', width: '100%' }} />

          <div className="flex gap-16">
            <div className="skeleton rounded-lg" style={{ height: '56px', flex: 1 }} />
            <div className="skeleton rounded-lg" style={{ height: '56px', flex: 1 }} />
          </div>
        </div>
      </div>
    </div>
  );
}


