export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-5 sm:mb-6"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <div className="border border-gray-200 rounded-[12px] p-4 sm:p-6 bg-white shadow-sm">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="border border-gray-200 rounded-[12px] p-4 sm:p-6 bg-white shadow-sm">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="border border-gray-200 rounded-[12px] p-4 sm:p-6 bg-white shadow-sm">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      </div>

      <div className="border border-gray-200 rounded-[12px] overflow-hidden bg-white shadow-sm p-4">
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
}
