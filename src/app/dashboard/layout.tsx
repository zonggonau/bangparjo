'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { SettingsProvider } from '@/context/SettingsContext';

const NAV = [
  { id: 'dashboard', label: 'Overview', icon: '📊', path: '/dashboard' },
  { id: 'orders', label: 'Orders', icon: '📦', path: '/dashboard/orders' },
  { id: 'inventory', label: 'Inventory', icon: '📦', path: '/dashboard/inventory' },
  { id: 'importer', label: 'Product Importer', icon: '📥', path: '/dashboard/importer' },
  { id: 'subscribers', label: 'Subscribers', icon: '📧', path: '/dashboard/subscribers' },
  { id: 'support', label: 'Support & Disputes', icon: '🎧', path: '/dashboard/support' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/dashboard/settings' },
  { id: 'webhooks', label: 'Webhook Logs', icon: '📡', path: '/dashboard/webhooks' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') return <div style={{ background: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a' }}>Loading...</div>;

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <SettingsProvider>
      <div style={{
        display: 'flex',
        height: '100vh',
        background: '#ffffff', // Shadcn Default White
        color: '#09090b', // Zinc 950
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden'
      }}>
        {/* Sidebar Shadcn Style */}
        <aside style={{
          width: '240px',
          background: '#fafafa', // Zinc 50
          borderRight: '1px solid #e4e4e7', // Zinc 200
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #e4e4e7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', background: '#18181b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>B</div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>BangParjo Admin</span>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '1.25rem 0.75rem' }}>
             <p style={{ padding: '0 0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu Utama</p>
            {NAV.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.75rem',
                    textDecoration: 'none',
                    color: isActive ? '#09090b' : '#71717a',
                    background: isActive ? '#f4f4f5' : 'transparent', // Zinc 100
                    borderRadius: '6px',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.85rem',
                    transition: 'all 0.15s',
                    marginBottom: '2px'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid #e4e4e7' }}>
            <Link href="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.75rem',
              color: '#71717a',
              fontSize: '0.85rem',
              textDecoration: 'none',
              fontWeight: 500,
              borderRadius: '6px'
            }}>
              🏠 View Store
            </Link>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.6rem 0.75rem',
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                borderRadius: '6px',
                marginTop: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              🚪 Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Shadcn Style */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#ffffff' }}>
          <header style={{ height: '57px', borderBottom: '1px solid #e4e4e7', display: 'flex', alignItems: 'center', padding: '0 2rem', position: 'sticky', top: 0, background: 'white/80', backdropFilter: 'blur(8px)', zIndex: 10 }}>
             <div style={{ fontSize: '0.8rem', color: '#71717a' }}>
               Admin <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>/</span> 
               <span style={{ color: '#09090b', fontWeight: 500 }}>{NAV.find(n => n.path === pathname)?.label || 'Overview'}</span>
             </div>
          </header>
          <div style={{ padding: '2rem 3rem', maxWidth: '1440px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </SettingsProvider>
  );
}
