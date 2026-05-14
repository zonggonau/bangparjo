'use client';

export default function ProductSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/10" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-16 bg-white/10 rounded-full" />
          <div className="h-3 w-3 bg-white/10 rounded-full" />
          <div className="h-3 w-12 bg-white/10 rounded-full" />
        </div>
        <div className="h-5 w-full bg-white/10 rounded-lg mb-2" />
        <div className="h-5 w-2/3 bg-white/10 rounded-lg mb-4" />
        <div className="flex items-end gap-3 mb-4">
          <div className="h-7 w-20 bg-white/10 rounded-lg" />
          <div className="h-4 w-12 bg-white/10 rounded-lg" />
        </div>
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-3 bg-white/10 rounded-full" />
            ))}
          </div>
          <div className="h-3 w-16 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container px-4 py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Gallery Skeleton */}
        <div className="space-y-6">
          <div className="aspect-square bg-white/5 border border-white/10 rounded-[3rem] animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Details Skeleton */}
        <div className="flex flex-col gap-8 py-4">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-white/5 rounded-full animate-pulse" />
            <div className="h-12 w-full bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-12 w-3/4 bg-white/5 rounded-2xl animate-pulse" />
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-4 animate-pulse">
            <div className="h-10 w-40 bg-white/10 rounded-xl" />
            <div className="h-4 w-32 bg-white/10 rounded-lg" />
          </div>

          <div className="space-y-4 border-t border-white/5 pt-8 animate-pulse">
            <div className="h-4 w-24 bg-white/5 rounded-lg" />
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-16 bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="h-32 w-full bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />

          <div className="flex gap-4 pt-4">
            <div className="h-16 flex-1 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-16 flex-1 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}


