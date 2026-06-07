'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSettings } from '@/context/SettingsContext';
import CartCounter from './CartCounter';
import FavoriteCounter from './FavoriteCounter';
import { getCategoryMenuAction } from '@/lib/actions-catalog';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [activeL1, setActiveL1] = useState<string | null>(null);
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('q');
      setSearchQuery(q || '');
    }
  }, [pathname]);

  useEffect(() => {
    getCategoryMenuAction()
      .then(data => {
        if (data.success && data.data) {
          setCategories(data.data);
          if (data.data.length > 0) setActiveL1(data.data[0].id);
        }
      })
      .catch(err => console.error('Menu fetch error:', err));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  const toggleNav = () => setMobileOpen(!isMobileOpen);

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('women')) return 'fa-venus';
    if (n.includes('men')) return 'fa-mars';
    if (n.includes('electronic')) return 'fa-laptop';
    if (n.includes('home')) return 'fa-home';
    if (n.includes('health') || n.includes('man')) return 'fa-sparkles';
    if (n.includes('toy')) return 'fa-gamepad';
    if (n.includes('sport')) return 'fa-running';
    if (n.includes('automotive')) return 'fa-car';
    if (n.includes('jewelry')) return 'fa-gem';
    if (n.includes('computer')) return 'fa-desktop';
    if (n.includes('phone')) return 'fa-mobile-alt';
    if (n.includes('pet')) return 'fa-paw';
    if (n.includes('bag')) return 'fa-shopping-bag';
    return 'fa-th-large';
  };

  const activeCategory = categories.find(c => c.id === activeL1);

  return (
    <header className="sticky top-0 z-[1000] bg-white border-b border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      {/* Top announcement bar - responsive */}
      <div className="bg-[#1A1A1A] text-white py-1.5 sm:py-2 text-[11px] sm:text-[13px] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 flex items-center justify-between">
          {/* Left: Shipping info */}
          <div className="hidden sm:flex items-center gap-1 whitespace-nowrap overflow-x-auto scrollbar-hide">
            <span>🌍 Worldwide Delivery | ✈️ Fast International Shipping  </span>
            {/* <span className="text-[#FF6B00] font-semibold">Free shipping over ${settings.freeShippingThreshold}</span> */}
          </div>
          <div className="sm:hidden flex items-center gap-1 whitespace-nowrap overflow-x-auto scrollbar-hide">
            <span>🌍 Worldwide | ✈️ Fast Shipping | </span>
            {/* <span className="text-[#FF6B00] font-semibold">Free shipping over ${settings.freeShippingThreshold}</span> */}
          </div>
          {/* Right: Track Order | Help | Contact */}
          <div className="flex items-center gap-3 sm:gap-4 whitespace-nowrap">
            <Link href="/track" className="text-white/80 hover:text-white transition-colors duration-200 no-underline">Track Order</Link>
            <span className="text-white/30">|</span>
            <Link href="/help-center" className="text-white/80 hover:text-white transition-colors duration-200 no-underline">Help</Link>
            <span className="text-white/30">|</span>
            <Link href="/contact" className="text-white/80 hover:text-white transition-colors duration-200 no-underline">Contact</Link>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="py-2 sm:py-3">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5">
          <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
            {/* Logo - paling kiri */}
            <Link href="/" className="text-[18px] sm:text-[22px] lg:text-[26px] font-extrabold text-[#1A1A1A] tracking-[-1px] shrink-0 whitespace-nowrap">
              {settings.storeName.split('.')[0]}<span className="text-[#FF6B00]">{settings.storeName.split('.').slice(1).join('.') || 'Parjo'}</span>
            </Link>
            
            {/* Desktop nav menu - setelah brand */}
            <nav className="hidden lg:block shrink-0">
              <ul className="flex items-center gap-6 xl:gap-8">
                <li className="relative static group">
                  <Link href="/category" className="text-[14px] xl:text-[15px] font-semibold text-[#555555] hover:text-[#FF6B00] transition-all duration-300 relative py-1 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[2px] after:bg-[#FF6B00] after:transition-all after:duration-300 hover:after:w-full">
                    <i className="fas fa-bars mr-1.5"></i>
                    All Categories
                  </Link>
                  
                  {/* CJ Style Mega Menu */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-full max-w-[1400px] bg-white shadow-[0_15px_30px_rgba(0,0,0,0.1)]  opacity-0 invisible translate-y-2.5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-[1000] overflow-hidden group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 hover:opacity-100 hover:visible hover:translate-y-0">
                    <div className="flex h-auto max-h-[650px]">
                      {/* Sidebar - scroll if more than 14 categories */}
                      <div className="w-[295px] bg-[#fcfcfc] border-r border-[#f0f0f0] py-2.5 overflow-y-auto">
                        {/* All Products link */}
                        <div className="px-5 mb-1">
                          <Link href="/category/all" className="flex items-center justify-between py-3 text-[14px] font-bold no-underline text-[#FF6B00] border-b border-orange-100" onClick={() => setMobileOpen(false)}>
                            <span>
                              <i className="fas fa-th-large" style={{ width: '20px', marginRight: '10px', opacity: 0.8 }}></i>
                              All Products
                            </span>
                            <i className="fas fa-chevron-right text-[10px] opacity-30"></i>
                          </Link>
                        </div>
                        {categories.map((cat) => (
                          <div 
                            key={cat.id} 
                            className={`px-5 transition-all duration-200 ${activeL1 === cat.id ? 'bg-white relative before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#FF6B00]' : ''}`}
                            onMouseEnter={() => setActiveL1(cat.id)}
                          >
                            <Link href={`/category/${cat.slug}`} className={`flex items-center justify-between py-3 text-[14px] font-semibold no-underline ${activeL1 === cat.id ? 'text-[#FF6B00]' : 'text-[#333]'}`}>
                              <span>
                                <i className={`fas ${getIcon(cat.name)}`} style={{ width: '20px', marginRight: '10px', opacity: 0.6 }}></i>
                                {cat.name}
                              </span>
                              <i className="fas fa-chevron-right text-[10px] opacity-30"></i>
                            </Link>
                          </div>
                        ))}
                      </div>

                      {/* Content Panel */}
                      <div className="flex-1 p-[30px_40px] overflow-y-auto bg-white">
                        {activeCategory && (
                          <div className="grid grid-cols-4 gap-10">
                            {activeCategory.children?.map((l2: any) => (
                              <div key={l2.id} className="mb-5">
                                <h4 className="text-[15px] font-extrabold mb-[15px] pb-2 border-b-2 border-[#f0f0f0] relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-10 after:h-[2px] after:bg-[#FF6B00]">
                                  <Link href={`/category/${l2.slug}`} className="text-[#333] no-underline hover:text-[#FF6B00]">{l2.name}</Link>
                                </h4>
                                <div className="flex flex-col gap-2">
                                  {l2.children?.map((l3: any) => (
                                    <Link key={l3.id} href={`/category/${l3.slug}`} className="text-[#666] no-underline text-[13px] font-medium transition-all duration-200 hover:text-[#FF6B00] hover:pl-[5px]">
                                      {l3.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
                <li><Link href="/blog" className="text-[14px] xl:text-[15px] font-semibold text-[#555555] hover:text-[#FF6B00] transition-all duration-300 relative py-1 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[2px] after:bg-[#FF6B00] after:transition-all after:duration-300 hover:after:w-full">Blog</Link></li>
                <li><Link href="/about" className="text-[14px] xl:text-[15px] font-semibold text-[#555555] hover:text-[#FF6B00] transition-all duration-300 relative py-1 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[2px] after:bg-[#FF6B00] after:transition-all after:duration-300 hover:after:w-full">About</Link></li>
              </ul>
            </nav>

            {/* Search bar - di tengah, lebih lebar */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center bg-[#F5F5F5] rounded-[50px] px-4 flex-1 max-w-[320px] lg:max-w-[480px] xl:max-w-[560px] border-2 border-transparent transition-all duration-300 focus-within:border-[#FF6B00] focus-within:bg-white">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-2 sm:py-2.5 px-2 bg-transparent text-[13px] sm:text-[14px] text-[#1A1A1A] placeholder:text-[#888888] outline-none border-none"
              />
              <button type="submit" className="bg-none cursor-pointer text-[#888888] text-base sm:text-lg p-1.5 transition-all duration-300 hover:text-[#FF6B00] border-none">
                <i className="fas fa-search"></i>
              </button>
            </form>

            {/* Icons + Hamburger - paling kanan */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 shrink-0">
              {/* Search icon on mobile only */}
              <button className="sm:hidden bg-none cursor-pointer text-[18px] text-[#555555] p-1.5 border-none" onClick={() => document.getElementById('mobile-search')?.focus()}>
                <i className="fas fa-search"></i>
              </button>
              <Link href={session ? "/dashboard" : "/login"} className="relative bg-none cursor-pointer text-[18px] sm:text-[20px] lg:text-[22px] text-[#555555] transition-all duration-300 hover:text-[#FF6B00] p-1.5 flex items-center gap-1.5" title={session ? "Dashboard" : "Login"}>
                {!session && <i className="far fa-user"></i>}
                {session && <span className="text-[14px] font-bold">Dashboard</span>}
              </Link>
              <Link href="/favorites" className="relative bg-none cursor-pointer text-[18px] sm:text-[20px] lg:text-[22px] text-[#555555] transition-all duration-300 hover:text-[#FF6B00] p-1.5" title="Wishlist">
                <i className="far fa-heart"></i>
                <FavoriteCounter />
              </Link>
              <Link href="/cart" className="relative bg-none cursor-pointer text-[18px] sm:text-[20px] lg:text-[22px] text-[#555555] transition-all duration-300 hover:text-[#FF6B00] p-1.5" title="Cart">
                <i className="fas fa-shopping-bag"></i>
                <CartCounter />
              </Link>
              <button className="flex lg:hidden flex-col gap-[4px] sm:gap-[5px] cursor-pointer p-1.5 bg-none border-none ml-1" id="hamburger" onClick={toggleNav}>
                <span className="w-5 sm:w-6 h-[2px] bg-[#1A1A1A] rounded-[2px] transition-all duration-300"></span>
                <span className="w-5 sm:w-6 h-[2px] bg-[#1A1A1A] rounded-[2px] transition-all duration-300"></span>
                <span className="w-5 sm:w-6 h-[2px] bg-[#1A1A1A] rounded-[2px] transition-all duration-300"></span>
              </button>
            </div>
          </div>

          {/* Mobile search bar - shown below navbar on mobile */}
          <form onSubmit={handleSearch} className="sm:hidden flex items-center bg-[#F5F5F5] rounded-[50px] px-3 mt-2 border-2 border-transparent transition-all duration-300 focus-within:border-[#FF6B00] focus-within:bg-white">
            <input 
              id="mobile-search"
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-2 px-3 bg-transparent text-[13px] text-[#1A1A1A] placeholder:text-[#888888] outline-none border-none"
            />
            <button type="submit" className="bg-none cursor-pointer text-[#888888] text-base p-1.5 transition-all duration-300 hover:text-[#FF6B00] border-none">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" onClick={toggleNav}></div>
          {/* Drawer */}
          <div className="absolute top-0 right-0 w-[300px] max-w-[85vw] h-full bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-base text-[#1A1A1A]">Menu</span>
              <button className="bg-none cursor-pointer text-xl text-[#555555] p-1 border-none" onClick={toggleNav}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4">
              {/* Main nav links */}
              <Link href="/" className="block py-3 text-[15px] font-medium text-[#555555] border-b border-gray-50 no-underline" onClick={toggleNav}>🏠 Home</Link>
              <Link href="/category/all" className="block py-3 text-[15px] font-bold text-[#FF6B00] border-b border-orange-100 no-underline" onClick={toggleNav}>📦 All Products</Link>
              
              {/* Category tree for mobile */}
              {categories.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mt-3 mb-1 px-1">Categories</p>
                  {categories.map(cat => (
                    <div key={cat.id}>
                      <Link href={`/category/${cat.slug}`} className="block py-2.5 text-[14px] font-semibold text-[#555555] border-b border-gray-50 no-underline hover:text-[#FF6B00]" onClick={toggleNav}>
                        {cat.name}
                      </Link>
                      {/* L2 children inline */}
                      {cat.children?.length > 0 && (
                        <div className="ml-3 pl-3 border-l-2 border-gray-100">
                          {cat.children.map((l2: any) => (
                            <Link key={l2.id} href={`/category/${l2.slug}`} className="block py-1.5 text-[13px] text-gray-500 no-underline hover:text-[#FF6B00]" onClick={toggleNav}>
                              {l2.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Utility links */}
              <div className="border-t border-gray-100 pt-3 mt-2">
                <Link href="/track" className="block py-2.5 text-[14px] font-medium text-[#555555] no-underline hover:text-[#FF6B00]" onClick={toggleNav}>📦 Track Order</Link>
                <Link href="/help-center" className="block py-2.5 text-[14px] font-medium text-[#555555] no-underline hover:text-[#FF6B00]" onClick={toggleNav}>❓ Help Center</Link>
                <Link href="/contact" className="block py-2.5 text-[14px] font-medium text-[#555555] no-underline hover:text-[#FF6B00]" onClick={toggleNav}>📧 Contact</Link>
                <Link href="/favorites" className="block py-2.5 text-[14px] font-medium text-[#555555] no-underline hover:text-[#FF6B00]" onClick={toggleNav}>❤️ Wishlist</Link>
                <Link href={session ? "/dashboard" : "/login"} className="block py-2.5 text-[14px] font-medium text-[#555555] no-underline hover:text-[#FF6B00]" onClick={toggleNav}>👤 {session ? 'Dashboard' : 'Login'}</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
