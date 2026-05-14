'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Heart, ShoppingBag, ChevronLeft } from 'lucide-react';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('favorites') || '[]');
        const validFavorites = stored.filter((f: any) => typeof f === 'object' && f !== null && f.pid);
        setFavorites(validFavorites);
        
        if (validFavorites.length !== stored.length) {
          localStorage.setItem('favorites', JSON.stringify(validFavorites));
          window.dispatchEvent(new Event('favoritesUpdated'));
        }
      } catch (e) {
        console.error('Failed to parse favorites', e);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();

    window.addEventListener('favoritesUpdated', loadFavorites);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'favorites') loadFavorites();
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      window.removeEventListener('favoritesUpdated', loadFavorites);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container text-center py-20">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4 hover:opacity-70 transition-opacity"
            >
              <ChevronLeft size={14} /> Back to Store
            </Link>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
              YOUR <span className="text-primary italic">WISHLIST</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              You have {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved for later.
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 md:p-24 text-center backdrop-blur-xl">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-8">
              <Heart size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4 uppercase tracking-tight">Your wishlist is empty</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-10 text-sm leading-relaxed">
              Looks like you haven&apos;t found anything you love yet. Explore our latest collections and click the heart icon to save items here!
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-2xl shadow-white/5"
            >
              <ShoppingBag size={20} /> Browse Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {favorites.map((product) => (
              <ProductCard key={product.pid} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

