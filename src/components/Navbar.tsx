'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import CartCounter from './CartCounter';
import FavoriteCounter from './FavoriteCounter';

const ICON_MAP: Record<string, string> = {
  'Consumer Electronics': '📱',
  'Computer & Office': '💻',
  'Home Improvement': '🏠',
  'Automobiles & Motorcycles': '🚗',
  'Jewelry': '💍',
  'Beauty': '💄',
  'Home & Garden': '🏡',
  'Kitchen': '🍳',
  'Toys & Kids': '🧸',
  'Sports': '⚽',
};

export default function Navbar() {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isMegaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();
  const megaRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Fetch categories for menu
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
    }
  };

  return (
    <header className="header">
      {/* Top Bar */}
      <div className="navTop">
        <span>🔥 Trending Now | Join 10K+ shoppers in the community</span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/track">Track Order</Link>
          <span>|</span>
          <Link href="/help-center">Help Center</Link>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navContainer">
          {/* Logo */}
          <Link href="/" className="logo">
            <div className="logoIcon">🛍️</div>
            <span className="logoText">{settings.storeName}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navMain">
            <Link href="/" className="navLink">Home</Link>

            {/* Mega Menu - Categories */}
            <div className="navItem" ref={megaRef}>
              <button className="navLink">
                Categories
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="megaMenu">
                <div className="megaMenuHeader">
                  <h3>All Categories</h3>
                  <Link href="/category">Browse All →</Link>
                </div>
                <div className="megaMenuGrid">
                  {categories.map((cat) => (
                    <div key={cat.id} className="megaMenuColumn">
                      <Link href={`/category/${cat.slug}`} className="megaMenuMainLink">
                        <span className="megaMenuIcon">{ICON_MAP[cat.name] || '📦'}</span>
                        {cat.name}
                      </Link>
                      {cat.children && cat.children.length > 0 && (
                        <div className="megaSubList">
                          {cat.children.slice(0, 5).map((sub: any) => (
                            <Link key={sub.id} href={`/category/${sub.slug}`} className="megaSubLink">
                              {sub.name}
                            </Link>
                          ))}
                          {cat.children.length > 5 && (
                             <Link href={`/category/${cat.slug}`} className="megaSubMore">
                               View all {cat.children.length} sub-categories...
                             </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/category/consumer-electronics-D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2" className="navLink">Electronics</Link>
            <Link href="/category/health-beauty-and-hair-2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902" className="navLink">Beauty</Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '280px' }}>
            <div className="navSearchBar">
              <span className="navSearchIcon">🔍</span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="navbar-search"
              />
            </div>
          </form>

            {/* Right Icons */}
            <div className="navRight">
              <Link href="/favorites" className="navIconBtn" title="Favorites">
                ♥
                <FavoriteCounter />
              </Link>
              <Link href="/cart" className="navIconBtn" title="Cart">
                🛒
                <CartCounter />
              </Link>
            </div>

          {/* Mobile Menu Button */}
          <button
            className="mobileMenuBtn"
            onClick={() => setMobileOpen(!isMobileOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div style={{
            background: 'var(--white)',
            borderTop: '1px solid var(--border)',
            padding: '1rem var(--container-padding)',
          }}>
            <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
              <div className="navSearchBar" style={{ maxWidth: '100%', width: '100%' }}>
                <span className="navSearchIcon">🔍</span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link href="/" className="navLink" onClick={() => setMobileOpen(false)}>🏠 Home</Link>
              <Link href="/category" className="navLink" onClick={() => setMobileOpen(false)}>📦 All Categories</Link>
              {categories.slice(0, 8).map(cat => (
                <Link key={cat.id} href={`/category/${cat.slug}`} className="navLink" onClick={() => setMobileOpen(false)}>
                  {ICON_MAP[cat.name] || '📦'} {cat.name}
                </Link>
              ))}
              <Link href="/track" className="navLink" onClick={() => setMobileOpen(false)}>🚚 Track Order</Link>
              <Link href="/cart" className="navLink" onClick={() => setMobileOpen(false)}>🛒 Cart</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
