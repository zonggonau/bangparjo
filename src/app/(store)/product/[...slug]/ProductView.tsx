'use client';

import { parseProductName, parseProductImage, formatUSD, stripCommonPrefix } from '@/lib/utils';
import { calculateFinalPrice } from '@/lib/pricing';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useState, useEffect } from 'react';
import { ProductDetailSkeleton } from '@/components/ProductSkeleton';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import AIChat from '@/components/AIChat';
import { getProductDetailsAction } from '@/lib/actions-catalog';
import { countries } from '@/lib/countries';

function renderStars(score: any) {
  const parsed = parseInt(score);
  const validScore = isNaN(parsed) ? 0 : Math.max(0, Math.min(5, parsed));
  return '★'.repeat(validScore) + '☆'.repeat(5 - validScore);
}

export default function ProductView({ id, initialData, initialError, selectedVid }: { id: string, initialData: any, initialError: string | null, selectedVid?: string }) {
  const { addToCart } = useCart();
  const { settings, activeCoupons } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [product, setProduct] = useState<any>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(initialError);

  const initialVariant = (initialData?.variants || []).find((v: any) => v.vid === selectedVid || v.variantKey === selectedVid) || ((initialData?.variants?.length > 0) ? initialData.variants[0] : null);

  const [selectedImage, setSelectedImage] = useState<string>(() => {
    const vImg = initialVariant?.variantImage || initialVariant?.image;
    if (vImg) return parseProductImage(vImg);
    return initialData ? parseProductImage(initialData.bigImage) : '';
  });
  const [selectedVariant, setSelectedVariant] = useState<any>(initialVariant);
  const [qty, setQty] = useState(1);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const displayName = product ? parseProductName(product.productNameEn || product.productName) : '';

  // Social share
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${displayName} on Bangparjo!`;
  const shareLinks = [
    { name: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, icon: 'fab fa-whatsapp', color: '#25D366' },
    { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, icon: 'fab fa-facebook', color: '#1877F2' },
    { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, icon: 'fab fa-twitter', color: '#1DA1F2' },
    { name: 'Pinterest', url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`, icon: 'fab fa-pinterest', color: '#E60023' },
    { name: 'Copy Link', url: '#', icon: 'fas fa-link', color: '#666', action: () => { navigator.clipboard.writeText(shareUrl); setShowShareMenu(false); alert('Link copied!'); } },
  ];

  useEffect(() => {
    if (!id || initialData) return;
    setLoading(true);
    setError(null);
    getProductDetailsAction(id)
      .then(res => {
        if (res.success && res.data) {
          setProduct(res.data);
          const matchedVariant = (res.data.variants || []).find((v: any) => v.vid === selectedVid || v.variantKey === selectedVid) || ((res.data.variants?.length > 0) ? res.data.variants[0] : null);
          
          setSelectedVariant(matchedVariant);
          const vImg = matchedVariant?.image || matchedVariant?.variantImage;
          setSelectedImage(parseProductImage(vImg || res.data.bigImage || res.data.productImage));
        } else {
          setError('Product not found.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[ProductView] Error:', err);
        setError('Failed to load product.');
        setLoading(false);
      });
  }, [id, initialData, selectedVid]);

  // Update URL when variant changes
  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
    
    // Update URL query param without full navigation
    try {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
      params.set('v', variant.vid);
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    } catch (e) {
      // Fallback: ignore URL update error
    }
  };

  useEffect(() => {
    const vImg = selectedVariant?.image || selectedVariant?.variantImage;
    if (vImg) {
      const variantImg = parseProductImage(vImg);
      if (variantImg && variantImg !== '/placeholder.png') setSelectedImage(variantImg);
    }
  }, [selectedVariant]);


  // ── Product Reviews ──────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsScore, setReviewsScore] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!product?.pid) return;
    setReviewsLoading(true);

    // Use the dedicated API route with Redis caching + 5s timeout to avoid
    // blocking on CJ QPS limits. Falls back to empty gracefully on timeout/error.
    const params = new URLSearchParams({ pid: product.pid });
    if (reviewsScore != null) params.set('score', reviewsScore.toString());
    params.set('pageNum', reviewsPage.toString());
    params.set('pageSize', '5');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    fetch(`/api/product-reviews?${params.toString()}`, { signal: controller.signal })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setReviews(res.data.list || []);
          setReviewsTotal(parseInt(res.data.total || '0'));
        }
      })
      .catch(() => {
        // Silently fail — reviews are non-critical
        setReviews([]);
        setReviewsTotal(0);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setReviewsLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [product?.pid, reviewsPage, reviewsScore]);

  // ── Shipping Rates ───────────────────────────────────────────────────────
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [shippingCountry, setShippingCountry] = useState('US');
  const [showShippingCalculator, setShowShippingCalculator] = useState(false);

  const calculateShipping = async () => {
    if (!selectedVariant) return;
    
    const originalPrice = selectedVariant?.variantSellPrice ? Number(selectedVariant.variantSellPrice) : (typeof product?.sellPrice === 'number' ? product.sellPrice : parseFloat(String(product?.sellPrice)));

    setShippingRates([]);
    setShippingLoading(true);

    try {
      const sku = selectedVariant.variantSku || selectedVariant.vid;
      const weight = selectedVariant.variantWeight || product?.productWeight || 500;
      const res = await fetch(`/api/shipping-rates?sku=${sku}&quantity=${qty}&country=${shippingCountry}&subtotal=${originalPrice}&weight=${weight}`);
      const data = await res.json();
      if (data.success) {
        setShippingRates(data.data);
      }
    } catch (err) {
      console.error('Failed to load shipping rates:', err);
    } finally {
      setShippingLoading(false);
    }
  };

  // ── Inventory ────────────────────────────────────────────────────────────
  const [realStock, setRealStock] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedVariant) return;
    const fallbackStock = Array.isArray(selectedVariant.inventories)
      ? selectedVariant.inventories.reduce((sum: number, inv: any) => sum + (inv.totalInventory || inv.totalInventoryNum || 0), 0) 
      : (selectedVariant.totalInventoryNum || selectedVariant.inventory || 0);
    setRealStock(fallbackStock);
  }, [selectedVariant]);

  const getProductActiveCoupon = (productCjId: string) => {
    if (!activeCoupons) return null;
    const now = new Date();
    // 1. Find coupon specifically assigned to this product
    const specificCoupon = activeCoupons.find(c => {
      const isExpired = c.expiresAt ? new Date(c.expiresAt) <= now : false;
      const isExhausted = c.maxUses !== null ? c.usedCount >= c.maxUses : false;
      const isValid = c.isActive && !isExpired && !isExhausted;
      if (!isValid) return false;
      return c.products && c.products.some((pr: any) => pr.productCjId === productCjId);
    });

    if (specificCoupon) return specificCoupon;

    // 2. Find general active coupon (no products listed, meaning general store-wide)
    const generalCoupon = activeCoupons.find(c => {
      const isExpired = c.expiresAt ? new Date(c.expiresAt) <= now : false;
      const isExhausted = c.maxUses !== null ? c.usedCount >= c.maxUses : false;
      const isValid = c.isActive && !isExpired && !isExhausted;
      if (!isValid) return false;
      return !c.products || c.products.length === 0;
    });

    return generalCoupon || null;
  };

  // Harga jual langsung dari DB (sellingPrice sudah include margin)
  const currentCjPrice = selectedVariant?.variantSellPrice 
    ? Number(selectedVariant.variantSellPrice)
    : (typeof product?.sellPrice === 'number' ? product?.sellPrice : Number(product?.sellPrice || 0));
    
  const finalPrice = calculateFinalPrice(currentCjPrice, settings);

  // ── Discount calculation ──────────────────────────────────────────────
  const fakeOriginalPrice = finalPrice * 1.35; // Display 35% fake discount


  const handleAddToCart = () => {
    if (!product) return;
    const variantInfo = selectedVariant ? { 
      vid: selectedVariant.vid, 
      sku: selectedVariant.variantSku, 
      name: selectedVariant.variantNameEn || selectedVariant.variantKey,
      image: selectedVariant.variantImage
    } : undefined;
    const normalizedPrice = selectedVariant?.variantSellPrice 
      ? Number(selectedVariant.variantSellPrice)
      : (typeof product.sellPrice === 'number' ? product.sellPrice : (product.sellPrice ? Number(product.sellPrice) : 0));
    const isCouponProduct = product?.pid ? !!getProductActiveCoupon(product.pid) : false;
    const cartProduct = { ...product, sellPrice: normalizedPrice || 0, isCouponProduct };
    addToCart(cartProduct, variantInfo, qty);
  };

  if (loading) return <ProductDetailSkeleton />;
  if (error || !product) return (
    <div className="py-16 text-center">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">{error || 'Product Not Found'}</h1>
        <Link href="/" className="inline-block mt-5 px-6 py-2.5 rounded-md font-semibold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline">Back to Home</Link>
      </div>
    </div>
  );

  const allImages = (() => {
    const imgSet = Array.isArray(product.productImageSet)
      ? product.productImageSet
      : typeof product.productImageSet === 'string'
      ? product.productImageSet.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    const raw = [product.bigImage, ...imgSet, ...(typeof product.productImage === 'string' && product.productImage.startsWith('[') ? (() => { try { return JSON.parse(product.productImage); } catch { return []; } })() : [product.productImage])]
      .map((img: any) => parseProductImage(img))
      .filter((img: string) => img && img !== '/placeholder.png');
    const seen = new Set<string>();
    return raw.filter((img: string) => { if (seen.has(img)) return false; seen.add(img); return true; }).slice(0, 6);
  })();

  // ── Real data from CJ (if available) ─────────────────────────────────────
  // Use real reviews data for rating display
  const realRatingCount = reviewsTotal || 0;
  const realAvgScore = reviews.length > 0 
    ? Math.round(reviews.reduce((sum: number, r: any) => {
        const score = parseInt(r.score || '0');
        return sum + (isNaN(score) ? 0 : score);
      }, 0) / reviews.length) 
    : 0;
  const hasRealReviews = realRatingCount > 0;


  return (
    <div className="bg-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
          <Link href="/" className="text-gray-500 no-underline hover:text-[#FF6B00]">Home</Link>
          <span>/</span>
          <Link href="/category" className="text-gray-500 no-underline hover:text-[#FF6B00]">Products</Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-medium truncate">{displayName}</span>
        </div>
      </div>

      <section className="py-8 md:py-12">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="relative w-full aspect-square rounded-[16px] overflow-hidden bg-gray-50 border border-gray-100">
                <img src={selectedImage} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img: string) => (
                  <div 
                    key={img} 
                    className={`relative w-20 h-20 rounded-[10px] overflow-hidden border-2 cursor-pointer transition-all duration-200 shrink-0 ${selectedImage === img ? 'border-[#FF6B00] shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'}`} 
                    onClick={() => setSelectedImage(img)}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5 lg:max-h-screen lg:overflow-y-auto">
              <p className="text-sm font-semibold text-[#FF6B00] uppercase tracking-wider">{product.categoryName || 'Imported'}</p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1A1A1A] leading-tight">{displayName}</h1>
              
              {hasRealReviews ? (
                <div className="flex items-center gap-2">
                  <span className="text-[#FFB800] text-base sm:text-lg">{renderStars(realAvgScore)}</span>
                  <span className="text-xs sm:text-sm text-gray-500">({realRatingCount} reviews)</span>
                </div>
              ) : reviewsLoading ? (
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              ) : null}

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-3xl font-black text-[#FF6B00]">{formatUSD(finalPrice)}</span>
                  <span className="px-2 py-1 rounded-[6px] bg-[#FFF3E8] text-[#FF6B00] text-xs font-bold tracking-wide">
                    -35% OFF
                  </span>
                </div>
                <span className="text-sm text-gray-400 line-through font-medium">
                  {formatUSD(fakeOriginalPrice)}
                </span>
              </div>


              {product.variants && product.variants.length > 0 && (() => {
                const shortLabels = stripCommonPrefix(product.variants.map((v: any) => v.variantNameEn || v.variantKey || ''));
                return (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Options</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant: any, idx: number) => (
                        <button 
                          key={variant.vid} 
                          className={`px-3 py-1.5 rounded-[6px] text-[13px] font-semibold border-2 transition-all duration-200 cursor-pointer ${
                            selectedVariant?.vid === variant.vid 
                              ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]' 
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                          onClick={() => handleVariantSelect(variant)}
                        >
                          {shortLabels[idx]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#1A1A1A]">Quantity</h3>
                <div className="flex items-center border border-gray-200 rounded-[8px] overflow-hidden w-fit">
                  <button 
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 cursor-pointer border-none bg-white"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                  >
                    <i className="fas fa-minus text-[10px]"></i>
                  </button>
                  <input 
                    type="number" 
                    value={qty} 
                    readOnly 
                    className="w-12 h-10 text-center text-[13px] font-bold text-[#1A1A1A] border-x border-gray-200 outline-none bg-white"
                  />
                  <button 
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 cursor-pointer border-none bg-white"
                    onClick={() => setQty(qty + 1)}
                  >
                    <i className="fas fa-plus text-[10px]"></i>
                  </button>
                </div>
              </div>

              {/* Actions (Add to Cart & Buy Now) */}
              <div className="flex gap-3 pt-2">
                <button 
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-[10px] font-bold text-sm bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 cursor-pointer border-none"
                  onClick={handleAddToCart}
                >
                  <i className="fas fa-shopping-bag"></i> Add to Cart
                </button>
                <Link 
                  href={`/checkout?pid=${id}${selectedVariant ? `&vid=${selectedVariant.vid}` : ''}&qty=${qty}${searchParams?.get('coupon') ? `&coupon=${searchParams.get('coupon')}` : ''}`} 
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-[10px] font-bold text-sm bg-[#1A1A1A] text-white hover:bg-[#333] transition-all duration-200 no-underline"
                >
                  Buy Now
                </Link>
              </div>

              {/* Share Buttons */}
              <div className="relative">
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                >
                  <i className="fas fa-share-alt"></i> Share
                </button>
                {showShareMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-[12px] border border-gray-200 shadow-lg p-2 z-50 min-w-[200px]">
                    {shareLinks.map((link) => (
                      link.action ? (
                        <button 
                          key={link.name} 
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 cursor-pointer border-none"
                          onClick={link.action}
                        >
                          <i className={link.icon} style={{ color: link.color, width: '20px', textAlign: 'center' }}></i>
                          {link.name}
                        </button>
                      ) : (
                        <a 
                          key={link.name} 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 no-underline"
                        >
                          <i className={link.icon} style={{ color: link.color, width: '20px', textAlign: 'center' }}></i>
                          {link.name}
                        </a>
                      )
                    ))}
                  </div>
                )}
              </div>


              {/* Shipping Info */}
              <div className="p-4 bg-gray-50 rounded-[10px] border border-gray-200 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🚚</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <strong className="text-sm text-[#1A1A1A] block">Shipping Estimate</strong>
                       <button onClick={() => setShowShippingCalculator(!showShippingCalculator)} className="text-xs font-bold text-[#FF6B00] bg-transparent border-none cursor-pointer">
                         {showShippingCalculator ? 'Hide' : 'Calculate'}
                       </button>
                    </div>

                    {showShippingCalculator && (
                      <div className="mb-3 flex items-center gap-2">
                        <select 
                          className="px-3 py-1.5 text-sm border border-gray-200 bg-white text-gray-600 rounded-[6px] outline-none w-full cursor-pointer"
                          value={shippingCountry}
                          onChange={(e) => setShippingCountry(e.target.value)}
                        >
                          {countries.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </select>
                        <button 
                          className="px-4 py-1.5 bg-[#1A1A1A] text-white text-sm font-bold rounded-[6px] border-none cursor-pointer disabled:opacity-50"
                          onClick={calculateShipping}
                          disabled={shippingLoading}
                        >
                          {shippingLoading ? '...' : 'Go'}
                        </button>
                      </div>
                    )}

                    {shippingLoading ? (
                      <p className="text-sm text-gray-500 m-0 mt-1 animate-pulse">Calculating rates...</p>
                    ) : shippingRates.length > 0 ? (
                      <p className="text-sm text-gray-600 m-0 mt-1">
                        Starting from <strong className="text-[#1A1A1A]">{shippingRates[0].formattedPrice}</strong> <span className="text-xs text-gray-500">({shippingRates[0].estimatedDays})</span>
                      </p>
                    ) : showShippingCalculator && !shippingLoading && shippingRates.length === 0 ? (
                      <p className="text-sm text-amber-600 m-0 mt-1">Shipping rates will be calculated at checkout.</p>
                    ) : null}
                  </div>
                </div>
                
                {!shippingLoading && shippingRates.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                     {shippingRates.slice(0, 2).map((rate) => (
                       <div key={rate.logisticName} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{rate.logisticName}</span>
                          <strong className="text-[#1A1A1A]">{rate.formattedPrice}</strong>
                       </div>
                     ))}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <span className="text-sm text-gray-600">Secure &amp; encrypted payment</span>
                </div>
              </div>

              {/* Inventory Status */}
              <div className="p-4 bg-gray-50 rounded-[10px] border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-boxes text-[#FF6B00]"></i>
                  <h3 className="text-sm font-bold text-[#1A1A1A] m-0">Stock Availability</h3>
                </div>
                {selectedVariant ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${(realStock ?? 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm font-semibold text-[#1A1A1A]">
                        {(realStock ?? 0) > 999 
                          ? '999+ units in stock' 
                          : `${(realStock ?? 0).toLocaleString()} units in stock`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 m-0">Select a variant to check stock.</p>
                )}
              </div>

              {/* Contact AI Chat */}
              <div className="p-4 bg-[#FFF3E8] rounded-[10px] border border-[#FF6B00]/20 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
                  <i className="fas fa-robot text-white text-xl"></i>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-[#1A1A1A]">Need help? Ask Parjo AI!</div>
                  <p className="text-xs text-[#888] m-0">Get instant answers about this product</p>
                </div>
                <button 
                  onClick={() => {
                    const event = new CustomEvent('openAiChat', { 
                      detail: { 
                        productId: id, 
                        productName: displayName,
                        productImage: selectedImage,
                        price: formatUSD(finalPrice)
                      } 
                    });
                    window.dispatchEvent(event);
                  }}
                  className="px-4 py-2 rounded-[6px] font-bold text-[13px] bg-[#FF6B00] text-white border-none whitespace-nowrap hover:bg-[#E06000] transition-all duration-200 cursor-pointer"
                >
                  <i className="fas fa-comment-dots mr-1.5"></i> Ask AI
                </button>
              </div>

            </div>
          </div>

          {/* Product Description (full width below both columns) */}
          <div className="pt-8 sm:pt-10 mt-8 sm:mt-10 border-t border-gray-200">
            <h3 className="text-lg md:text-xl font-bold text-[#1A1A1A] mb-4 sm:mb-5">Product Description</h3>
            <div 
              className="description-content text-sm sm:text-base leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
          </div>

          {/* Product Reviews */}
          <div className="pt-8 sm:pt-10 mt-8 sm:mt-10 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-bold text-[#1A1A1A]">Customer Reviews</h3>
              <div className="flex items-center gap-2">
                <select 
                  className="px-3 py-1.5 rounded-[8px] text-sm border border-gray-200 bg-white text-gray-600 outline-none cursor-pointer"
                  value={reviewsScore ?? ''}
                  onChange={e => { setReviewsScore(e.target.value ? parseInt(e.target.value) : undefined); setReviewsPage(1); }}
                >
                  <option value="">All Ratings</option>
                  <option value="5">★★★★★ (5)</option>
                  <option value="4">★★★★☆ (4)</option>
                  <option value="3">★★★☆☆ (3)</option>
                  <option value="2">★★☆☆☆ (2)</option>
                  <option value="1">★☆☆☆☆ (1)</option>
                </select>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-[10px]">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any, idx: number) => (
                  <div key={`${review.commentId || idx}-${idx}`} className="p-4 bg-gray-50 rounded-[10px] border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-xs font-bold">
                          {review.commentUser?.charAt(0) || '?'}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#1A1A1A]">{review.commentUser}</span>
                          <span className="text-[#FFB800] text-xs ml-2">
                            {renderStars(review.score || '0')}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(review.commentDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    {review.commentUrls?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.commentUrls.slice(0, 3).map((url: string, i: number) => (
                          <img key={i} src={url} alt="Review" className="w-16 h-16 rounded-[8px] object-cover border border-gray-200" loading="lazy" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Pagination */}
                {reviewsTotal > 5 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button 
                      className="px-3 py-1.5 rounded-[6px] text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                      disabled={reviewsPage <= 1}
                      onClick={() => setReviewsPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {reviewsPage} of {Math.ceil(reviewsTotal / 5)}
                    </span>
                    <button 
                      className="px-3 py-1.5 rounded-[6px] text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                      disabled={reviewsPage >= Math.ceil(reviewsTotal / 5)}
                      onClick={() => setReviewsPage(p => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <i className="fas fa-comment-dots text-4xl mb-3"></i>
                <p className="text-sm">No reviews yet for this product.</p>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* AI Chat (floating) */}
      <AIChat />
    </div>
  );
}
