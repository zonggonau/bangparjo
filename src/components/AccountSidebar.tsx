'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/account', label: 'Dashboard', icon: 'fas fa-chart-pie' },
  { href: '/account/orders', label: 'My Orders', icon: 'fas fa-box' },
  { href: '/account/addresses', label: 'Addresses', icon: 'fas fa-map-marker-alt' },
  { href: '/favorites', label: 'Wishlist', icon: 'fas fa-heart' },
  { href: '/account/settings', label: 'Settings', icon: 'fas fa-cog' },
];

export default function AccountSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.slice(0, 2).toUpperCase() || 'JD';

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-md">
      <div className="p-6 sm:p-8 text-center border-b border-gray-100 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] bg-gradient-to-br from-orange-400 to-[#FF6B00] text-white flex items-center justify-center text-xl sm:text-2xl font-black mx-auto mb-4 shadow-md shadow-orange-200 transform transition-transform hover:scale-105">
            {initials}
          </div>
          <h4 className="font-extrabold text-base sm:text-lg text-[#1A1A1A] truncate">{session?.user?.name || 'Member'}</h4>
          <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{session?.user?.email}</p>
          
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Active
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Navigation</p>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold no-underline transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? 'bg-orange-50 text-[#FF6B00] shadow-sm border border-orange-100' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-[#1A1A1A]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-[#FF6B00] rounded-r-md"></div>
              )}
              <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors ${
                isActive ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-white text-gray-400 border border-gray-200 group-hover:border-gray-300 group-hover:text-gray-600'
              }`}>
                <i className={`${link.icon} text-xs`}></i>
              </div>
              {link.label}
              
              {isActive && (
                <i className="fas fa-chevron-right ml-auto text-[10px] opacity-50"></i>
              )}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-100 mt-auto">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full border-none bg-white text-left flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold text-red-500 cursor-pointer transition-all duration-300 hover:bg-red-50 border border-transparent hover:border-red-100 hover:shadow-sm"
        >
          <div className="w-8 h-8 rounded-[10px] bg-red-50 text-red-500 flex items-center justify-center">
            <i className="fas fa-sign-out-alt text-xs"></i>
          </div>
          Logout
        </button>
      </div>
    </div>
  );
}

// Hamburger button for mobile header
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden w-10 h-10 flex items-center justify-center rounded-[12px] text-[#1A1A1A] hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
      aria-label="Open menu"
    >
      <i className="fas fa-bars"></i>
    </button>
  );
}
