'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { useSession } from 'next-auth/react';
import { syncWishlistAction, getWishlistAction } from '@/lib/actions';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  // Load favorites from localStorage
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

  useEffect(() => {
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

  // Sync to DB when user is logged in
  useEffect(() => {
    if (!session?.user?.email) return;
    if (loading) return;

    const timer = setTimeout(async () => {
      try {
        await syncWishlistAction(favorites);
      } catch (e) {
        console.error('Wishlist sync failed:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [favorites, loading, session?.user?.email]);

  // Load from DB when user logs in (if localStorage is empty)
  useEffect(() => {
    if (!session?.user?.email) return;
    if (favorites.length > 0) return; // Already have local items

    const loadFromDB = async () => {
      try {
        const data = await getWishlistAction();
        if (data.success && data.data && data.data.length > 0) {
          const dbItems = data.data.map((item: any) => ({
            pid: item.pid,
            productName: item.productName || '',
            productNameEn: item.productNameEn || '',
            productImage: item.productImage || '',
            bigImage: item.bigImage || '',
            sellPrice: item.sellPrice || 0,
            categoryName: item.categoryName || '',
          }));
          setFavorites(dbItems);
          localStorage.setItem('favorites', JSON.stringify(dbItems));
        }
      } catch (e) {
        console.error('Wishlist load from DB failed:', e);
      }
    };

    loadFromDB();
  }, [session?.user?.email]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <i className="fas fa-spinner fa-spin text-[#FF6B00] text-[32px]"></i>
          </div>
          <p className="font-bold text-gray-500 uppercase tracking-[2px] text-xs">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-20">
      {/* Header */}
      <div className="mb-16">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#FF6B00] text-xs font-bold uppercase mb-4 no-underline"
        >
          <i className="fas fa-chevron-left"></i> Back to Store
        </Link>
        <h1 className="text-[48px] font-black text-[#1A1A1A] m-0 mb-2">
          YOUR <span className="text-[#FF6B00] italic">WISHLIST</span>
        </h1>
        <p className="text-gray-500 text-base font-semibold">
          You have {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved for later.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-[32px] p-20 text-center border border-gray-200">
          <div className="flex items-center justify-center w-[100px] h-[100px] rounded-full bg-gray-50 mx-auto mb-8 text-[40px] text-[#FF6B00]">
            <i className="fas fa-heart"></i>
          </div>
          <h2 className="text-[32px] font-black text-[#1A1A1A] mb-4">Your wishlist is empty</h2>
          <p className="text-gray-500 max-w-[500px] mx-auto mb-10 leading-relaxed">
            Looks like you haven't found anything you love yet. Explore our latest collections and click the heart icon to save items here!
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-10 py-4 text-base rounded-[16px] font-semibold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200"
          >
            <i className="fas fa-shopping-bag"></i> &nbsp;Browse Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {favorites.map((product) => (
            <ProductCard key={product.pid} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
