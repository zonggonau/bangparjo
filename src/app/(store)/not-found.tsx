import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-8">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-[40px] font-black text-[#1A1A1A] mb-4">Page Not Found</h1>
      <p className="text-gray-500 max-w-[400px] mb-10 leading-relaxed">
        Looks like this trend went cold — the page you're looking for doesn't exist.
        Let's get you back to what's hot!
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-10 py-4 rounded-full font-bold text-lg bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline"
        >
          🔥 Back to Trending
        </Link>
        <Link
          href="/category"
          className="inline-flex items-center justify-center px-10 py-4 rounded-full font-bold text-lg bg-gray-100 text-[#1A1A1A] border border-gray-200 hover:bg-gray-200 transition-all duration-200 no-underline"
        >
          🛍️ Browse Categories
        </Link>
      </div>
    </div>
  );
}
