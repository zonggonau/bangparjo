'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/account', label: '📊 Dashboard' },
  { href: '/account/orders', label: '📋 My Orders' },
  { href: '/account/addresses', label: '📍 Addresses' },
  { href: '/favorites', label: '❤️ Wishlist' },
  { href: '/account/settings', label: '⚙️ Settings' },
];

export default function AccountSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.slice(0, 2).toUpperCase() || 'JD';

  return (
    <>
      <div className="p-4 sm:p-6 text-center border-b border-gray-200">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-50 text-[#FF6B00] flex items-center justify-center text-lg sm:text-2xl font-bold mx-auto mb-2 sm:mb-3">
          {initials}
        </div>
        <h4 className="font-semibold text-sm sm:text-base text-[#1A1A1A] truncate">{session?.user?.name || 'Member'}</h4>
        <p className="text-xs sm:text-sm text-gray-500 truncate">{session?.user?.email}</p>
      </div>
      <div className="p-2 sm:p-3">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-[6px] text-xs sm:text-sm font-medium no-underline transition-all duration-200 ${
                isActive ? 'bg-orange-50 text-[#FF6B00]' : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full border-none bg-transparent text-left flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-[6px] text-xs sm:text-sm font-medium text-red-500 cursor-pointer transition-all duration-200 hover:bg-red-50"
        >
          🚪 Logout
        </button>
      </div>
    </>
  );
}

// Hamburger button for mobile header
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[8px] text-[#1A1A1A] hover:bg-gray-100 transition-colors cursor-pointer"
      aria-label="Open menu"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 5H17.5M2.5 10H17.5M2.5 15H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
