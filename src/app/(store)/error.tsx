'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-8">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-[32px] font-black text-[#1A1A1A] mb-4">Oops! Something went wrong 😅</h1>
      <p className="text-gray-500 max-w-[450px] mb-8 leading-relaxed">
        Our social shopping vibes hit a little snag. Give it another try — the community's waiting!
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-7 py-3.5 rounded-full font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 border-none cursor-pointer"
        >
          🔄 Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-7 py-3.5 rounded-full font-bold bg-gray-100 text-[#1A1A1A] border border-gray-200 hover:bg-gray-200 transition-all duration-200 no-underline"
        >
          🏠 Go Home
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-7 py-3.5 rounded-full font-semibold bg-transparent text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all duration-200 no-underline text-sm"
        >
          📧 Contact Support
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs text-gray-400">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
