export default function LoadingStore() {
  return (
    <div className="animate-pulse max-w-[1400px] mx-auto px-5 py-10 w-full">
      {/* Hero Skeleton */}
      <div className="h-[300px] sm:h-[400px] bg-gray-200 rounded-2xl w-full mb-10"></div>
      
      {/* Filters/Sorting Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div className="h-10 bg-gray-200 rounded-lg w-full sm:w-1/3"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-full sm:w-1/4"></div>
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm p-3">
            {/* Image Skeleton */}
            <div className="h-40 sm:h-48 bg-gray-200 rounded-lg w-full mb-4"></div>
            {/* Title Skeleton */}
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            {/* Price Skeleton */}
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
