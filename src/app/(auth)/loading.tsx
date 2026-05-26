export default function LoadingAuth() {
  return (
    <div className="animate-pulse flex items-center justify-center min-h-[80vh] w-full px-4 py-10">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
        {/* Logo/Title Skeleton */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Inputs Skeletons */}
        <div className="space-y-5">
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
          </div>
          <div>
             <div className="flex justify-between mb-2">
               <div className="h-4 bg-gray-200 rounded w-1/4"></div>
               <div className="h-4 bg-gray-200 rounded w-1/5"></div>
             </div>
             <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="h-12 bg-gray-300 rounded-xl w-full mt-8 mb-6"></div>

        {/* Footer Text Skeleton */}
        <div className="flex justify-center">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
}
