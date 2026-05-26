export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto w-full animate-fade-in">
      {/* Header Skeleton */}
      <div className="mb-10">
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
        <div className="h-4 w-96 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-[16px] border border-[#E2E8F0] p-8 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-[12px] bg-gray-100 animate-pulse"></div>
              <div className="w-10 h-4 rounded bg-gray-100 animate-pulse"></div>
            </div>
            <div className="mt-5">
              <div className="w-24 h-4 bg-gray-100 rounded animate-pulse mb-3"></div>
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden h-[400px] animate-pulse">
          <div className="h-16 border-b border-[#E2E8F0] bg-gray-50/50"></div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden h-[400px] animate-pulse">
          <div className="h-16 border-b border-[#E2E8F0] bg-gray-50/50"></div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
