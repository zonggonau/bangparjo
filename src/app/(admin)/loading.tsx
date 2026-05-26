export default function LoadingAdmin() {
  return (
    <div className="animate-pulse p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      {/* Page Title Skeleton */}
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mt-4"></div>
          </div>
        ))}
      </div>

      {/* Table Area Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Table Rows Skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded w-full"></div>
          {[...Array(5)].map((_, i) => (
             <div key={i} className="h-16 bg-gray-50 rounded border-b border-gray-100 w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
