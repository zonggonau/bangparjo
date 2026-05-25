'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'overview',  label: 'Dashboard',  icon: 'fas fa-chart-line', path: '/dashboard' },
      { id: 'analytics', label: 'Analytics',  icon: 'fas fa-chart-pie',  path: '/dashboard/analytics' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { id: 'orders',     label: 'Orders',      icon: 'fas fa-shopping-cart', path: '/dashboard/orders' },
      { id: 'myproducts', label: 'My Products', icon: 'fas fa-star',         path: '/dashboard/myproducts' },
      { id: 'inventory',  label: 'Inventory',   icon: 'fas fa-box',          path: '/dashboard/inventory' },
      { id: 'importer',   label: 'Importer',    icon: 'fas fa-download',     path: '/dashboard/importer' },
      { id: 'disputes',   label: 'Disputes',    icon: 'fas fa-gavel',        path: '/dashboard/disputes' },
      { id: 'coupon',     label: 'Coupons',     icon: 'fas fa-tag',          path: '/dashboard/coupon' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'warehouse', label: 'Warehouses', icon: 'fas fa-warehouse', path: '/dashboard/warehouse' },
      { id: 'support',   label: 'Support',    icon: 'fas fa-headset',   path: '/dashboard/support' },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'blog',  label: 'Blog',  icon: 'fas fa-blog',         path: '/dashboard/blog' },
      { id: 'about', label: 'About', icon: 'fas fa-info-circle',   path: '/dashboard/about' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'subscribers',  label: 'Customers',     icon: 'fas fa-users',     path: '/dashboard/subscribers' },
      { id: 'webhooks',     label: 'Webhooks',      icon: 'fas fa-bell',      path: '/dashboard/webhooks/settings' },
      { id: 'webhook-logs', label: 'Webhook Logs',  icon: 'fas fa-file-alt',  path: '/dashboard/webhooks' },
      { id: 'settings',     label: 'Settings',      icon: 'fas fa-cog',       path: '/dashboard/settings' },
    ],
  },
];

export const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => {
      initial[g.label] = g.label === 'Overview';
    });
    return initial;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname) {
      setExpandedGroups(prev => {
        const next = { ...prev };
        NAV_GROUPS.forEach(g => {
          const hasActive = g.items.some(item => item.path === pathname);
          if (hasActive) next[g.label] = true;
        });
        return next;
      });
    }
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/dashboard" className="sidebar-logo">
          <i className="fas fa-bolt"></i>
          <span>Bang<span>Parjo</span></span>
        </Link>
      </div>
      
      <nav className="sidebar-nav">
        {NAV_GROUPS.map(group => {
          const isExpanded = expandedGroups[group.label] ?? (group.label === 'Overview');
          return (
            <div key={group.label} className={`sidebar-group ${isExpanded ? 'expanded' : 'collapsed'}`}>
              <button
                className="sidebar-group-header"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={isExpanded}
              >
                <span className="sidebar-group-label">{group.label}</span>
                <i className={`fas fa-chevron-down sidebar-group-chevron ${isExpanded ? 'rotated' : ''}`}></i>
              </button>
              <div className="sidebar-group-items">
                {group.items.map(item => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link href="/" className="nav-item" target="_blank">
          <i className="fas fa-external-link-alt"></i>
          <span>View Storefront</span>
        </Link>
        <button 
          className="nav-item" 
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', font: 'inherit', color: 'var(--admin-error)' }}
        >
          <i className="fas fa-power-off"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
