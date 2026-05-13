'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  Database, 
  Download, 
  Share2, 
  Users, 
  MessageSquare, 
  Bell, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  ExternalLink,
  Menu,
  X,
  Globe,
  Clock,
  Zap
} from 'lucide-react';
import { SettingsProvider } from '@/context/SettingsContext';

const NAV = [
  { id: 'overview',    label: 'Overview',        icon: LayoutDashboard, path: '/dashboard' },
  { id: 'orders',      label: 'Orders',           icon: Package,         path: '/dashboard/orders' },
  { id: 'inventory',   label: 'Inventory',        icon: Database,        path: '/dashboard/inventory' },
  { id: 'importer',    label: 'Product Importer', icon: Download,        path: '/dashboard/importer' },
  { id: 'social',      label: 'Social Poster',    icon: Share2,          path: '/dashboard/social' },
  { id: 'subscribers', label: 'Subscribers',      icon: Users,           path: '/dashboard/subscribers' },
  { id: 'support',     label: 'Support',          icon: MessageSquare,   path: '/dashboard/support' },
  { id: 'webhooks',    label: 'Webhook Logs',     icon: Bell,            path: '/dashboard/webhooks' },
  { id: 'settings',    label: 'Settings',         icon: Settings,        path: '/dashboard/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#07070e] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Synchronizing core...</p>
      </div>
    );
  }

  const currentPage = NAV.find(n => n.path === pathname);

  return (
    <SettingsProvider>
      <div className="flex h-screen bg-[#07070e] text-[#f0f0f6] overflow-hidden selection:bg-primary selection:text-white font-sans">

        {/* ── Mobile Overlay ── */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden transition-all" onClick={() => setMobileSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-[110]
          bg-[#0d0d16] border-r border-white/5 
          transition-all duration-500 ease-in-out
          flex flex-col overflow-hidden
          ${collapsed ? 'w-[80px]' : 'w-[280px]'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl shadow-black/50
        `}>
          {/* Logo */}
          <div className="flex items-center gap-4 px-6 py-8 border-b border-white/5 min-h-[100px]">
            <div className="w-10 h-10 min-w-[40px] bg-gradient-to-br from-primary to-accent-light rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-black text-black italic text-xl">B</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col animate-in fade-in duration-500">
                <span className="text-sm font-black uppercase italic tracking-tighter text-white">BangParjo</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Executive Panel</span>
              </div>
            )}
            <button 
              className="ml-auto hidden lg:flex w-8 h-8 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:border-primary/20 transition-all active:scale-95"
              onClick={() => setCollapsed(c => !c)}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar space-y-2">
            {!collapsed && (
              <p className="px-4 mb-4 text-[10px] font-black text-white/10 uppercase tracking-[0.3em] animate-in slide-in-from-left duration-500">Navigation</p>
            )}
            {NAV.map(item => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative
                    ${isActive 
                      ? 'bg-primary text-black shadow-lg shadow-primary/10' 
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }
                  `}
                  onClick={() => setMobileSidebarOpen(false)}
                  title={collapsed ? item.label : ''}
                >
                  <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {!collapsed && (
                    <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left duration-500">{item.label}</span>
                  )}
                  {!collapsed && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full shadow-lg" />
                  )}
                  {collapsed && isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full shadow-[0_0_10px_rgba(255,107,53,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 space-y-2 bg-black/20">
            <Link 
              href="/" 
              target="_blank"
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/20 hover:text-primary transition-all group"
            >
              <ExternalLink size={20} className="group-hover:rotate-12 transition-transform" />
              {!collapsed && (
                <span className="text-[10px] font-black uppercase tracking-widest">Storefront</span>
              )}
            </Link>
            
            <button
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all group"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              {!collapsed && (
                <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
              )}
            </button>

            {/* User info */}
            {!collapsed && session?.user && (
              <div className="mt-4 p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-700">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent-light/20 flex items-center justify-center text-primary border border-primary/20 font-black italic">
                  {(session.user.name || session.user.email || 'A')[0].toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate leading-none mb-1">
                    {session.user.name || 'Master Admin'}
                  </span>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest truncate leading-none">
                    Verified Operator
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Topbar */}
          <header className="h-[100px] border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-40 bg-[#07070e]/80 backdrop-blur-2xl">
            <div className="flex items-center gap-6">
              <button 
                className="lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-white transition-all active:scale-95"
                onClick={() => setMobileSidebarOpen(o => !o)}
              >
                {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              <div className="hidden md:flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  <span>Dashboard</span>
                  <ChevronRight size={10} className="opacity-50" />
                  <span className="text-primary">{currentPage?.label || 'Overview'}</span>
                </div>
                <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
                  {currentPage?.label || 'System Overview'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden lg:flex flex-col items-end">
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]" suppressHydrationWarning>
                   <Clock size={12} /> {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-[10px] font-bold text-white/10 uppercase tracking-widest" suppressHydrationWarning>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Core Active</span>
              </div>
            </div>
          </header>

          {/* Main Scrollable Content */}
          <main className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative">
             {/* Background Gradients */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-light/5 blur-[120px] rounded-full pointer-events-none" />
             
             <div className="relative z-10 max-w-[1600px] mx-auto">
               {children}
             </div>
          </main>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </SettingsProvider>
  );
}

