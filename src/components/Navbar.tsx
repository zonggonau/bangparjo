'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import CartCounter from './CartCounter';
import FavoriteCounter from './FavoriteCounter';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Menu, 
  X, 
  ChevronDown, 
  Globe, 
  Truck, 
  HelpCircle,
  Package,
  Home,
  Smartphone,
  Laptop,
  Home as HomeIcon,
  Car,
  Gem,
  Smile,
  Palmtree,
  ChefHat,
  Gamepad2,
  Trophy
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'Consumer Electronics': Smartphone,
  'Computer & Office': Laptop,
  'Home Improvement': HomeIcon,
  'Automobiles & Motorcycles': Car,
  'Jewelry': Gem,
  'Beauty': Smile,
  'Home & Garden': Palmtree,
  'Kitchen': ChefHat,
  'Toys & Kids': Gamepad2,
  'Sports': Trophy,
};

export default function Navbar() {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    fetch('/api/categories/menu')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.data);
      })
      .catch(err => console.error('Menu fetch error:', err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[1000] w-full transition-all duration-300 ${
      scrolled ? 'bg-[#07070e]/80 backdrop-blur-lg border-b border-white/10 shadow-lg' : 'bg-transparent'
    }`}>
      {/* Top Bar */}
      <div className="hidden md:flex bg-secondary py-1.5 px-6 justify-between items-center text-xs text-gray-400 border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Globe size={12} className="text-primary" /> Worldwide Shipping Available</span>
          <span className="flex items-center gap-1.5 text-white/70 underline decoration-primary/50 underline-offset-2 font-medium">Free shipping on orders over ${settings.freeShippingThreshold}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/track" className="hover:text-white transition-colors flex items-center gap-1.5"><Truck size={12} /> Track Order</Link>
          <span className="opacity-30">|</span>
          <Link href="/help-center" className="hover:text-white transition-colors flex items-center gap-1.5"><HelpCircle size={12} /> Help Center</Link>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="max-w-[1400px] mx-auto px-4 md:px-8 h-[72px] md:h-[88px] flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-accent-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 group-active:scale-95">
            <ShoppingCart size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-outfit text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {settings.storeName}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          <Link href="/" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">Home</Link>
          
          {/* Categories Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
              Categories <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
            </button>
            
            {/* Mega Menu */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[900px] bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl p-8 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Shop by Category</h3>
                <Link href="/category" className="text-sm font-semibold text-primary hover:underline underline-offset-4">Browse All →</Link>
              </div>
              <div className="grid grid-cols-4 gap-x-8 gap-y-10">
                {categories.map((cat) => {
                  const Icon = ICON_MAP[cat.name] || Package;
                  return (
                    <div key={cat.id} className="space-y-4">
                      <Link href={`/category/${cat.slug}`} className="flex items-center gap-3 font-bold text-white hover:text-primary transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Icon size={16} />
                        </div>
                        {cat.name}
                      </Link>
                      {cat.children && cat.children.length > 0 && (
                        <div className="flex flex-col gap-2.5 ml-11">
                          {cat.children.slice(0, 5).map((sub: any) => (
                            <Link key={sub.id} href={`/category/${sub.slug}`} className="text-xs text-gray-400 hover:text-white transition-colors">
                              {sub.name}
                            </Link>
                          ))}
                          {cat.children.length > 5 && (
                             <Link href={`/category/${cat.slug}`} className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1 hover:opacity-80">
                               + {cat.children.length - 5} More
                             </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <Link href="/category/consumer-electronics-D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">Electronics</Link>
          <Link href="/category/health-beauty-and-hair-2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">Beauty</Link>
        </div>

        {/* Search Bar */}
        <div className="hidden md:block flex-1 max-w-[400px]">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search premium products..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <Link href="/favorites" className="relative p-2 text-white/70 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
            <Heart size={22} />
            <FavoriteCounter />
          </Link>
          <Link href="/cart" className="relative p-2 text-white/70 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
            <ShoppingCart size={22} />
            <CartCounter />
          </Link>
          
          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors bg-white/5 rounded-xl ml-2"
            onClick={() => setMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
        isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`} onClick={() => setMobileOpen(false)}>
        <div className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-[#07070e] shadow-2xl p-6 transition-transform duration-500 ease-out ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-8">
             <span className="font-outfit text-xl font-bold bg-gradient-to-r from-primary to-accent-light bg-clip-text text-transparent">Menu</span>
             <button onClick={() => setMobileOpen(false)} className="p-2 bg-white/5 rounded-lg">
               <X size={20} />
             </button>
          </div>

          <form onSubmit={handleSearch} className="relative mb-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-2">
            <Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              <Home size={18} className="text-primary" /> Home
            </Link>
            <Link href="/category" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              <Package size={18} className="text-primary" /> All Categories
            </Link>
            
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Featured Categories</p>
              {categories.slice(0, 8).map(cat => {
                const Icon = ICON_MAP[cat.name] || Package;
                return (
                  <Link 
                    key={cat.id} 
                    href={`/category/${cat.slug}`} 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium" 
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} className="text-gray-400" /> {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-8 left-6 right-6 space-y-4">
            <Link href="/track" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 text-xs font-medium" onClick={() => setMobileOpen(false)}>
              <Truck size={16} /> Track Order
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

