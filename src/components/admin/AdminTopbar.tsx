'use client';

import { usePathname } from 'next/navigation';
import { ALL_NAV } from './AdminSidebar';
import { useEffect, useState } from 'react';

export default function AdminTopbar({ session }: { session: any }) {
  const pathname = usePathname();
  const currentPage = ALL_NAV.find(n => n.path === pathname) || ALL_NAV[0];
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.classList.add('sidebar-mobile-open');
    } else {
      document.body.classList.remove('sidebar-mobile-open');
    }
  }, [isMobileOpen]);

  // Close sidebar on path change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="topbar">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
            onClick={() => setIsMobileOpen(true)}
          >
            <i className="fas fa-bars"></i>
          </button>
          <h2>{currentPage?.label || 'Dashboard'}</h2>
        </div>
        <div className="topbar-right">
          <div className="topbar-date" suppressHydrationWarning>
            <i className="far fa-calendar-alt" style={{ marginRight: '8px', opacity: 0.5 }}></i>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="admin-profile" title={session?.user?.email || 'Admin'}>
            {(session?.user?.name || session?.user?.email || 'A')[0].toUpperCase()}
          </div>
        </div>
      </header>
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[900] md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
