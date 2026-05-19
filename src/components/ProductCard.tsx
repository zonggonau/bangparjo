'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CJProduct } from '@/lib/cj-api';
import { parseProductName, parseProductImage, slugify, formatUSD } from '@/lib/utils';
import { calculateFinalPrice } from '@/lib/pricing';
import { useSettings } from '@/context/SettingsContext';

export default function ProductCard({ product }: { product: CJProduct }) {
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

  return (
    <Link href={productUrl} className="block bg-white border border-[#E5E5E5] overflow-hidden transition-all duration-300 relative no-underline text-inherit cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-transparent">
      <div className="relative overflow-hidden aspect-square bg-[#F5F5F5]">
        <img src={productImage} alt={displayName} loading="lazy" className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" />
        <button 
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center cursor-pointer text-lg text-[#888888] transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-none hover:text-[#EF4444] hover:bg-[#FEF2F2]"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`} style={{ color: isFavorite ? '#EF4444' : '' }}></i>
        </button>
      </div>
      <div className="p-5">
        <p className="text-[12px] font-semibold text-[#FF6B00] uppercase tracking-[1px] mb-1.5">{product.categoryName}</p>
        <h3 className="text-[14px] font-normal mb-2 text-[#1A1A1A] line-clamp-2 leading-[1.4]">{displayName}</h3>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-[16px] sm:text-[20px] font-bold text-[#FF6B00]">{formatUSD(finalPrice)}</span>
        </div>
      </div>
    </Link>
  );
}
