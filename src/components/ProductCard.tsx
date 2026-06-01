'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CJProduct } from '@/lib/cj';
import { parseProductName, parseProductImage, slugify, formatUSD } from '@/lib/utils';
import { calculateFinalPrice } from '@/lib/pricing';
import { useSettings } from '@/context/SettingsContext';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product }: { product: CJProduct & { nowPrice?: string; discountPrice?: string; listedNum?: number; productWeight?: number; isFreeShipping?: boolean; productImageSet?: any } }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { settings, activeCoupons } = useSettings();
  const { addToCart } = useCart();

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favs.some((f: any) => (typeof f === 'string' ? f === product.pid : f.pid === product.pid)));
    } catch (e) {
      console.error('Failed to read favorites from localStorage:', e);
    }
  }, [product.pid]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
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
    } catch (e) {
      console.error('Failed to toggle favorite in localStorage:', e);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const getProductActiveCoupon = (productCjId: string) => {
      if (!activeCoupons) return null;
      const now = new Date();
      const specificCoupon = activeCoupons.find(c => {
        const isExpired = c.expiresAt ? new Date(c.expiresAt) <= now : false;
        const isExhausted = c.maxUses !== null ? c.usedCount >= c.maxUses : false;
        const isValid = c.isActive && !isExpired && !isExhausted;
        if (!isValid) return false;
        return c.products && c.products.some((pr: any) => pr.productCjId === productCjId);
      });
      return specificCoupon || null;
    };
    const isCouponProduct = !!getProductActiveCoupon(product.pid);
    addToCart({ 
      ...product, 
      sellPrice: typeof product.sellPrice === 'number' ? product.sellPrice : parseFloat(String(product.sellPrice)),
      isCouponProduct
    });
  };

  const displayName = parseProductName(product.productNameEn || product.productName);
  const prettySlug = slugify(displayName);
  const productUrl = `/product/${product.pid}/${prettySlug}`;

  const productImage = parseProductImage(product.bigImage || product.productImage);
  const secondImage = (() => {
    try {
      if (Array.isArray(product.productImageSet) && product.productImageSet.length > 0) {
        return parseProductImage(product.productImageSet[0]);
      }
      if (typeof product.productImageSet === 'string') {
        const parsed = JSON.parse(product.productImageSet);
        if (Array.isArray(parsed) && parsed.length > 0) return parseProductImage(parsed[0]);
      }
    } catch {}
    return null;
  })();

  const originalCjPrice = typeof product.sellPrice === 'number' ? product.sellPrice : parseFloat(String(product.sellPrice));
  const targetPrice = calculateFinalPrice(originalCjPrice, settings);
  const finalPrice = targetPrice;

  // ── Discount calculation ──────────────────────────────────────────────
  const nowPrice = product.nowPrice ? parseFloat(product.nowPrice) : null;
  const hasDiscount = nowPrice !== null && nowPrice > 0 && nowPrice < originalCjPrice;
  const discountPercent = hasDiscount ? Math.round((1 - nowPrice / originalCjPrice) * 100) : 0;
  const fakeOriginalPrice = hasDiscount ? calculateFinalPrice(originalCjPrice, { ...settings, markupPct: 0 }) : finalPrice * 1.35; // Generate 35% fake discount if no real discount

  // ── Stats & Dummy Data ────────────────────────────────────────────────
  const orderCount = product.listedNum || 0;
  const formattedOrders = orderCount > 0 ? (orderCount >= 1000 ? `${(orderCount / 1000).toFixed(1)}K` : orderCount.toString()) : null;
  const ratingVal = typeof product.pid === 'string' && product.pid.length > 0 ? (4.0 + (product.pid.charCodeAt(0) % 10) / 10) : 4.5;
  const dummyRating = ratingVal.toFixed(1);
  const dummyReviews = typeof product.pid === 'string' && product.pid.length > 1 ? (product.pid.charCodeAt(1) % 500) + 12 : 54;

  return (
    <Link 
      href={productUrl} 
      className="group block bg-white border border-[#E5E5E5]  overflow-hidden transition-all duration-300 relative no-underline text-inherit cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-transparent"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden aspect-square bg-[#F5F5F5]">
        {/* Main Image */}
        <img 
          src={productImage} 
          alt={displayName} 
          loading="lazy" 
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out ${isHovered && secondImage ? 'opacity-0 scale-100' : 'opacity-100 scale-100 group-hover:scale-105'}`} 
        />
        
        {/* Second Image (Hover Swap) */}
        {secondImage && (
          <img 
            src={secondImage} 
            alt={displayName} 
            loading="lazy" 
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out scale-105 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0'}`} 
          />
        )}
        
        {/* Discount Badge */}
        <div className="absolute top-3 left-3 bg-[#EF4444] text-white text-[11px] font-bold px-2 py-1 rounded-[4px] shadow-sm z-10">
          {hasDiscount ? `Save ${discountPercent}%` : 'Save 35%'}
        </div>

        {/* Free Shipping Badge */}
        {product.isFreeShipping && (
          <div className="absolute bottom-3 left-3 bg-[#10B981] text-white text-[10px] font-bold px-2 py-1 rounded-[4px] shadow-sm flex items-center gap-1 z-10">
            <i className="fas fa-truck text-[9px]"></i> Free Shipping
          </div>
        )}

        {/* Favorite Button */}
        <button 
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center cursor-pointer text-lg text-[#888888] transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-none hover:text-[#EF4444] hover:bg-[#FEF2F2] hover:scale-110 z-10"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`} style={{ color: isFavorite ? '#EF4444' : '' }}></i>
        </button>

        {/* Quick Add to Cart Button (Hover Reveal) */}
        <div className={`absolute bottom-3 right-3 transition-all duration-300 z-10 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button 
            className="w-10 h-10 bg-[#FF6B00] rounded-full flex items-center justify-center text-white shadow-lg border-none cursor-pointer hover:bg-[#E06000] hover:scale-110 transition-transform"
            onClick={handleAddToCart}
            title="Add to Cart"
          >
            <i className="fas fa-shopping-bag"></i>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 relative bg-white">
        <p className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-[1px] mb-1.5 truncate">{product.categoryName || 'Imported'}</p>
        <h3 className="text-[13px] sm:text-[14px] font-medium mb-2 text-[#1A1A1A] line-clamp-2 leading-[1.4] group-hover:text-[#FF6B00] transition-colors">{displayName}</h3>
        
        {/* Star Ratings */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[#FFB800] text-[10px]">
             {'★'.repeat(Math.max(0, Math.min(5, Math.round(parseFloat(dummyRating) || 5)))).padEnd(5, '☆')}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">({dummyRating} • {dummyReviews} reviews)</span>
        </div>

        {/* Price Section */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[16px] sm:text-[20px] font-black text-[#1A1A1A]">{formatUSD(finalPrice)}</span>
          <span className="text-[12px] sm:text-[13px] text-gray-400 font-medium line-through">{formatUSD(fakeOriginalPrice)}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400 mt-1">
          {formattedOrders && (
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-[4px]">
              <i className="fas fa-fire text-[#FF6B00] text-[10px]"></i>
              {formattedOrders} sold
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
