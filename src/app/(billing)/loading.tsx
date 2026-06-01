export default function LoadingBilling() {
  return (
    <div className="animate-pulse max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Side: Form Skeletons */}
        <div className="flex-1 w-full space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          
          <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
             <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-12 bg-gray-200 rounded w-full"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
             </div>
             <div className="h-12 bg-gray-200 rounded w-full mt-4"></div>
             <div className="h-12 bg-gray-200 rounded w-full mt-4"></div>
          </div>

          <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
             <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
             <div className="h-16 bg-gray-200 rounded w-full mb-4"></div>
             <div className="h-16 bg-gray-200 rounded w-full"></div>
          </div>
        </div>

        {/* Right Side: Order Summary Skeleton */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-24">
             <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
             
             {/* Product Items */}
             <div className="space-y-4 mb-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0"></div>
                    <div className="flex-1 space-y-2">
                       <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                       <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                ))}
             </div>

             {/* Totals */}
             <div className="border-t border-gray-200 pt-4 space-y-4">
                <div className="flex justify-between">
                   <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                   <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                </div>
                <div className="flex justify-between">
                   <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                   <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                   <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                   <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
             </div>

             <div className="h-14 bg-gray-200 rounded-lg w-full mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
