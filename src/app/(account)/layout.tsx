'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../globals.css';
import AccountSidebar, { MobileMenuButton } from '@/components/AccountSidebar';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="py-5 border-b border-gray-200 bg-white sticky top-0 z-[100]">
        <div className="max-w-[1400px] mx-auto px-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            <Link href="/" className="text-2xl no-underline font-bold">
              Bang<span className="text-[#FF6B00]">Parjo</span>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-bold text-gray-600 no-underline hover:text-[#FF6B00] transition-colors"
            >
              <i className="fas fa-arrow-left"></i> &nbsp;Back to Store
            </Link>
          </div>
        </div>
      </header>

      <main className="py-10">
        {/* Pass sidebarOpen state down via context or cloneElement */}
        <AccountLayoutContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
          {children}
        </AccountLayoutContent>
      </main>

      <footer className="py-10 text-center border-t border-gray-200 text-gray-400 text-xs">
        <div className="max-w-[1400px] mx-auto px-5">
          <p>&copy; {new Date().getFullYear()} BangParjo Shop. All rights reserved.</p>
          <div className="mt-3 flex justify-center gap-5">
            <Link href="/terms" className="text-inherit no-underline hover:text-gray-600">Terms</Link>
            <Link href="/privacy" className="text-inherit no-underline hover:text-gray-600">Privacy</Link>
            <Link href="/contact" className="text-inherit no-underline hover:text-gray-600">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Separate component to render sidebar with state
function AccountLayoutContent({ children, sidebarOpen, setSidebarOpen }: { children: React.ReactNode; sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void }) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-5">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        {/* Mobile overlay + drawer */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`lg:hidden fixed top-0 left-0 z-[160] h-full w-[280px] max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex justify-end p-3">
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <AccountSidebar />
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-[260px] min-w-[260px] border border-gray-200 rounded-[12px] overflow-hidden bg-white sticky top-[100px] self-start">
          <AccountSidebar />
        </div>

        <div className="flex-1 min-w-0 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
