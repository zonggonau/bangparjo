'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CJProduct, parseProductName, parseProductImage, slugify } from '@/lib/cj-helpers';
import { calculateFinalPrice } from '@/lib/pricing';
import { useSettings } from '@/context/SettingsContext';
import { Heart, Eye, ShoppingCart, Star } from 'lucide-react';

function formatUSD(price: number | string): string {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(p)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(p);
}

export default function ProductCard({ product, priority = false }: { product: CJProduct, priority?: boolean }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favs.some((f: any) => (typeof f === 'string' ? f === product.pid : f.pid === product.pid)));
  }, [product.pid]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    let nextFavs;
    const isCurrentlyFav = favs.some((f: any) => (typeof f === 'string' ? f === product.pid : f.pid === product.pid));

    if (!isCurrentlyFav) {
      const favProduct = {
        pid: product.pid,
        productName: product.productName,
        productNameEn: product.productNameEn,
        bigImage: product.bigImage,
        productImage: product.productImage,
        sellPrice: product.sellPrice,
        categoryName: product.categoryName
      };
      nextFavs = [...favs, favProduct];
    } else {
      nextFavs = favs.filter((f: any) => (typeof f === 'string' ? f !== product.pid : f.pid !== product.pid));
    }

    localStorage.setItem('favorites', JSON.stringify(nextFavs));
    setIsFavorite(!isCurrentlyFav);
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const displayName = parseProductName(product.productNameEn || product.productName);
  const prettySlug = slugify(displayName);
  const productUrl = `/product/${product.pid}/${prettySlug}`;

  const productImage = parseProductImage(product.bigImage || product.productImage);
  const originalCjPrice = typeof product.sellPrice === 'number' ? product.sellPrice : parseFloat(String(product.sellPrice));
  const finalPrice = calculateFinalPrice(originalCjPrice, settings);
  
  const discountPct = (product.pid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 21) + 10;
  const ratingCount = (parseInt(product.pid.slice(-3), 16) % 400) + 50;
  const starCount = Math.floor((parseInt(product.pid.slice(-1), 16) % 2) + 4);

  return (
    <div className="group relative bg-white/5 border border-white/10  overflow-hidden transition-all duration-500 hover:bg-white/10 hover:border-primary/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
      {/* Badges & Actions */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-primary text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
          -{discountPct}%
        </div>
      </div>

      <button 
        className="absolute top-4 right-4 z-10 p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-95 group-hover:opacity-100 opacity-0 md:opacity-100"
        onClick={toggleFavorite}
        aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart size={18} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white/70'} />
      </button>

      {/* Image Container */}
      <Link href={productUrl} className="relative block aspect-square overflow-hidden bg-white/5" prefetch={false}>
        <Image
          src={productImage}
          alt={displayName}
          fill
          sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          unoptimized
          priority={priority}
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-[0.1s]">
            <Eye size={20} />
          </div>
          <div className="w-12 h-12 bg-primary text-black rounded-2xl flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <ShoppingCart size={20} />
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Link 
            href={`/?q=${encodeURIComponent(product.categoryName)}`} 
            className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline underline-offset-4"
            prefetch={false}
          >
            {product.categoryName}
          </Link>
          <span className="text-white/20">•</span>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
            {(parseInt(product.pid.slice(-2), 16) % 1000) + 100}+ sold
          </span>
        </div>

        <Link href={productUrl} prefetch={false} className="block mb-4">
          <h3 className="text-sm font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors h-10">
            {displayName}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="flex items-end gap-3 mb-4">
          <span className="text-xl font-black text-white">{formatUSD(finalPrice)}</span>
          <span className="text-sm text-white/30 line-through mb-1 font-medium">
            {formatUSD(finalPrice * (1 + discountPct / 100))}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={12} 
                className={i < starCount ? 'fill-yellow-500 text-yellow-500' : 'text-white/10'} 
              />
            ))}
            <span className="text-[10px] font-bold text-white/30 ml-1">({ratingCount})</span>
          </div>
          <div className="text-[10px] font-black text-white/50 uppercase tracking-tighter">
            Free Shipping
          </div>
        </div>
      </div>
    </div>
  );
}

