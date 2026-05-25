'use client';

import { usePathname } from 'next/navigation';
import { ALL_NAV } from './AdminSidebar';

export default function AdminTopbar({ session }: { session: any }) {
  const pathname = usePathname();
  const currentPage = ALL_NAV.find(n => n.path === pathname) || ALL_NAV[0];

  return (
    <header className="topbar">
      <h2>{currentPage?.label || 'Dashboard'}</h2>
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
  );
}
