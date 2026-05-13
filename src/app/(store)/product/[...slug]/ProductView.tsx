'use client';

import { getProductDetails, getProducts, parseProductName, parseProductImage, slugify } from '@/lib/cj-api';
import { calculateFinalPrice } from '@/lib/pricing';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { ProductDetailSkeleton } from '@/components/ProductSkeleton';
import { 
  Star, 
  Check, 
  Heart, 
  ShoppingCart, 
  Zap, 
  Truck, 
  Shield, 
  Headphones, 
  Globe, 
  ChevronRight, 
  Home, 
  ArrowRight,
  Info,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';

function formatUSD(price: number | string) {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(p) ? '$0.00' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
}

function stripCommonPrefix(names: string[]): string[] {
  if (names.length === 0) return [];
  if (names.length === 1) return names;
  let prefix = names[0];
  for (const name of names.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < name.length && prefix[i] === name[i]) i++;
    prefix = prefix.slice(0, i);
  }
  const lastSpace = prefix.lastIndexOf(' ');
  const safeLen = lastSpace > 0 ? lastSpace : prefix.length;
  return names.map(n => n.slice(safeLen).trim() || n);
}

export default function ProductView({ id, initialData, initialError }: { id: string, initialData: any, initialError: string | null }) {
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const [product, setProduct] = useState<any>(initialData);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [selectedImage, setSelectedImage] = useState<string>(() => {
    return initialData ? parseProductImage(initialData.bigImage) : '';
  });
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(() => {
    return (initialData?.variants?.length > 0) ? initialData.variants[0] : null;
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const displayName = product ? parseProductName(product.productNameEn || product.productName) : '';

  useEffect(() => {
    if (initialData) {
      const keyword = initialData.categoryName || 'popular product';
      getProducts({ pageSize: 4, keyWord: keyword })
        .then(r => {
          if (r.success && r.data?.list) {
            setRelated(r.data.list.filter((p: any) => p.pid !== id));
          }
        })
        .catch(() => {});
    }
  }, [initialData, id]);

  useEffect(() => {
    if (id) {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favs.some((f: any) => (typeof f === 'string' ? f === id : f.pid === id)));
    }
  }, [id]);

  const toggleFavorite = () => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    let nextFavs;
    const isCurrentlyFav = favs.some((f: any) => (typeof f === 'string' ? f === id : f.pid === id));
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
      nextFavs = favs.filter((f: any) => (typeof f === 'string' ? f !== id : f.pid !== id));
    }
    localStorage.setItem('favorites', JSON.stringify(nextFavs));
    setIsFavorite(!isCurrentlyFav);
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  useEffect(() => {
    if (!id || initialData) return;
    const fetchProduct = async (attempt = 0) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getProductDetails(id);
        if (res.success) {
          setProduct(res.data);
          const rawImages = [
            res.data.bigImage,
            ...(res.data.productImageSet || []),
            ...(typeof res.data.productImage === 'string' && res.data.productImage.startsWith('[') ? JSON.parse(res.data.productImage) : [res.data.productImage]),
          ].map((img: any) => parseProductImage(img)).filter((img: string) => img && img !== '/placeholder.png');
          const seen = new Set<string>();
          const uniqueImages = rawImages.filter((img: string) => {
            if (seen.has(img)) return false;
            seen.add(img);
            return true;
          });
          const cover = uniqueImages[0] || parseProductImage(res.data.bigImage);
          setSelectedImage(prev => prev || cover);
          if (res.data.variants?.length > 0) {
            setSelectedVariant(res.data.variants[0]);
          }
          const keyword = res.data.categoryName || 'popular product';
          setTimeout(() => {
            getProducts({ pageSize: 4, keyWord: keyword })
              .then(r => {
                if (r.success && r.data?.list) {
                  setRelated(r.data.list.filter((p: any) => p.pid !== id));
                }
              })
              .catch(() => {});
          }, 1200);
        } else {
          const msg = res.message || '';
          const isQps = msg.toLowerCase().includes('too many') || msg.toLowerCase().includes('qps');
          if (isQps && attempt === 0) {
            await new Promise(r => setTimeout(r, 1500));
            return fetchProduct(1);
          }
          setError(isQps ? 'Terlalu banyak permintaan. Silakan tunggu sebentar lalu refresh halaman.' : msg || 'Produk tidak ditemukan');
        }
      } catch {
        setError('Gagal terhubung ke toko. Periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, initialData]);

  useEffect(() => {
    const vImg = selectedVariant?.image || selectedVariant?.variantImage;
    if (vImg) {
      const variantImg = parseProductImage(vImg);
      if (variantImg && variantImg !== '/placeholder.png') {
        setSelectedImage(variantImg);
      }
    }
    if (product && selectedVariant) {
      const titleSlug = slugify(displayName);
      const variantName = selectedVariant.variantNameEn || selectedVariant.variantKey || '';
      const variantSlug = slugify(variantName);
      const newUrl = `/product/${id}/${titleSlug}/${variantSlug}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [selectedVariant, id, product, displayName]);

  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const currentCjPrice = selectedVariant?.variantSellPrice ? Number(selectedVariant.variantSellPrice) : (typeof product?.sellPrice === 'number' ? product?.sellPrice : parseFloat(String(product?.sellPrice)));
  const originalPrice = calculateFinalPrice(currentCjPrice, settings);

  useEffect(() => {
    if (selectedVariant?.vid) {
      const timer = setTimeout(async () => {
        setShippingLoading(true);
        try {
          const res = await fetch(`/api/shipping-rates?vid=${selectedVariant.vid}&quantity=1&country=ID&subtotal=${originalPrice}`);
          const data = await res.json();
          if (data.success) {
            setShippingRates(data.data);
          }
        } catch (err) {
          console.error('Failed to fetch shipping:', err);
        } finally {
          setShippingLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedVariant?.vid, originalPrice]);

  const handleAddToCart = () => {
    const variantInfo = selectedVariant ? { vid: selectedVariant.vid, sku: selectedVariant.variantSku, name: selectedVariant.variantNameEn || selectedVariant.variantKey } : undefined;
    const normalizedPrice = selectedVariant?.variantSellPrice ? selectedVariant.variantSellPrice : (typeof product.sellPrice === 'number' ? product.sellPrice : parseFloat(String(product.sellPrice)));
    const cartProduct = { ...product, sellPrice: normalizedPrice };
    addToCart(cartProduct, variantInfo);
    setAdded(true);
    setShowToast(true);
    setTimeout(() => {
      setAdded(false);
      setShowToast(false);
    }, 3000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#07070e] pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="h-4 w-48 bg-white/5 rounded animate-pulse mb-10" />
        <ProductDetailSkeleton />
      </div>
    </div>
  );

  if (error) {
    const isRateLimit = error.toLowerCase().includes('too many') || error.toLowerCase().includes('qps') || error.toLowerCase().includes('terlalu');
    return (
      <div className="min-h-screen bg-[#07070e] flex items-center justify-center pt-32 pb-20 px-6">
        <div className="max-w-md w-full text-center space-y-8 p-10 bg-white/5 border border-white/10 rounded-[2.5rem]">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
            {isRateLimit ? <Clock size={40} /> : <AlertCircle size={40} />}
          </div>
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">{isRateLimit ? 'Rate Limit Reached' : 'Product Not Found'}</h1>
            <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
          </div>
          <div className="flex flex-col gap-3">
             {isRateLimit && (
               <button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary-dark text-black font-black py-4 rounded-2xl transition-all">
                 Try Again
               </button>
             )}
             <Link href="/" className="bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl hover:bg-white/10 transition-all">
               Return Home
             </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const allImages = (() => {
    const raw = [product.bigImage, ...(product.productImageSet || []), ...(typeof product.productImage === 'string' && product.productImage.startsWith('[') ? (() => { try { return JSON.parse(product.productImage); } catch { return []; } })() : [product.productImage])].map((img: any) => parseProductImage(img)).filter((img: string) => img && img !== '/placeholder.png');
    const seen = new Set<string>();
    return raw.filter((img: string) => { if (seen.has(img)) return false; seen.add(img); return true; }).slice(0, 6);
  })();

  const discountPct = 15;
  const originalPriceHigher = originalPrice * (1 + discountPct / 100);

  return (
    <div className="min-h-screen bg-[#07070e] pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 mb-10 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5 shrink-0">
            <Home size={12} /> Home
          </Link>
          <ChevronRight size={10} className="text-white/10 shrink-0" />
          <Link href={`/category/${product.categoryName?.toLowerCase().replace(/\s+/g, '-') || 'all'}`} className="hover:text-primary transition-colors shrink-0">
            {product.categoryName}
          </Link>
          <ChevronRight size={10} className="text-white/10 shrink-0" />
          <span className="text-white truncate max-w-[200px]">{displayName}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-16 lg:items-start">
          {/* Left: Image Gallery */}
          <div className="w-full lg:w-[55%] space-y-6">
            <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-white/5 border border-white/10 group">
              {selectedImage && (
                <Image
                  src={selectedImage}
                  alt={displayName}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority
                  unoptimized
                />
              )}
              <div className="absolute top-8 left-8">
                <div className="px-4 py-2 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl shadow-primary/20">
                  Save {discountPct}%
                </div>
              </div>
            </div>

            {allImages.length > 1 && (
              <div className="grid grid-cols-6 gap-4">
                {allImages.map((img: string, i: number) => (
                  <button
                    key={img}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-primary scale-95' : 'border-white/5 hover:border-white/20'}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image src={img} alt={`${displayName} ${i + 1}`} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="flex-1 space-y-10 lg:sticky lg:top-32">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                <Zap size={10} /> Popular Choice
              </div>
              <h1 className="font-outfit text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-1.5 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} className="text-white/10" />
                  <span className="text-white text-xs font-bold ml-1">4.5</span>
                  <span className="text-gray-600 text-xs">(128 reviews)</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                  <Check size={14} className="text-green-500" /> 1.2K+ Sold
                </div>
              </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">
              <div className="space-y-2">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-black text-white tracking-tighter">{formatUSD(originalPrice)}</span>
                  <span className="text-xl text-gray-600 line-through decoration-primary/50">{formatUSD(originalPriceHigher)}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={12} className="text-primary" /> Price in USD · Worldwide delivery
                </p>
              </div>

              {product.variants && product.variants.length > 0 && (() => {
                const allVariants = product.variants;
                const rawNames: string[] = allVariants.map((v: any) => v.variantNameEn || v.variantKey || '');
                const shortLabels = stripCommonPrefix(rawNames);
                return (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <LayoutGrid size={14} className="text-primary" /> Select Option
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {allVariants.map((variant: any, idx: number) => {
                        const isActive = selectedVariant?.vid === variant.vid;
                        const label = shortLabels[idx] || variant.variantNameEn || variant.variantKey;
                        const vImg = variant.image || variant.variantImage;
                        return (
                          <button
                            key={variant.vid}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${isActive ? 'bg-primary text-black border-primary scale-95 shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'}`}
                            onClick={() => setSelectedVariant(variant)}
                          >
                            {vImg && (
                              <div className="w-6 h-6 relative rounded-md overflow-hidden border border-black/10">
                                <Image src={parseProductImage(vImg)} alt={label} fill className="object-cover" unoptimized />
                              </div>
                            )}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex gap-3">
                  <button 
                    onClick={handleAddToCart}
                    className={`flex-1 h-16 flex items-center justify-center gap-3 rounded-[1.25rem] font-black uppercase tracking-widest transition-all ${added ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200 active:scale-95'}`}
                  >
                    {added ? <Check size={20} /> : <ShoppingCart size={20} />}
                    {added ? 'Added' : 'Add to Cart'}
                  </button>
                  <button 
                    onClick={toggleFavorite}
                    className={`w-16 h-16 flex items-center justify-center rounded-[1.25rem] border transition-all ${isFavorite ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                  >
                    <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                </div>
                <Link 
                  href={`/checkout?pid=${id}${selectedVariant ? `&vid=${selectedVariant.vid}` : ''}`} 
                  className="w-full h-16 bg-primary hover:bg-primary-dark text-black flex items-center justify-center gap-3 rounded-[1.25rem] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-primary/10"
                >
                  <Zap size={20} /> Buy Now
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-3">
                  <Truck size={24} className="text-primary" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase tracking-widest">Worldwide</p>
                    <p className="text-[10px] text-gray-500">Fast global shipping options</p>
                  </div>
               </div>
               <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-3">
                  <Shield size={24} className="text-primary" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase tracking-widest">Secure</p>
                    <p className="text-[10px] text-gray-500">100% encrypted checkout</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Description & Specs */}
        <div className="mt-32 space-y-16">
          <div className="flex items-center gap-6">
            <h2 className="font-outfit text-3xl font-black text-white uppercase tracking-tighter">Product Intelligence</h2>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 prose prose-invert prose-p:text-gray-400 prose-headings:text-white max-w-none">
               <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
            <div className="space-y-8">
               <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} className="text-primary" /> Trust Signals
                  </h3>
                  <ul className="space-y-4">
                    {[
                      { icon: <Shield size={14} />, text: 'Warranty Guaranteed' },
                      { icon: <Globe size={14} />, text: 'Global Authenticity' },
                      { icon: <Headphones size={14} />, text: 'VIP Support Access' },
                      { icon: <Check size={14} />, text: 'Quality Inspected' }
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="text-primary">{item.icon}</span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
               </div>
               
               <div className="p-8 bg-gradient-to-br from-primary to-primary-dark rounded-[2.5rem] space-y-4 group cursor-pointer overflow-hidden relative">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Zap size={120} fill="black" />
                  </div>
                  <h3 className="text-xs font-black text-black uppercase tracking-widest">Limited Edition</h3>
                  <p className="text-black font-bold text-lg leading-snug">This item is part of our curated global elite collection.</p>
                  <div className="flex items-center gap-2 text-black/60 font-black text-[10px] uppercase tracking-widest pt-4">
                    Explore Series <ArrowRight size={14} />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-32 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="font-outfit text-3xl font-black text-white uppercase tracking-tighter">You May Also Like</h2>
              <Link href="/category/all" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">View All →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {related.slice(0, 4).map((p: any) => (
                <ProductCard key={p.pid} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
           <div className="bg-white text-black p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-2xl">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                <Check size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Item Added</p>
                <p className="text-xs font-bold text-gray-500">Ready for checkout</p>
              </div>
              <Link href="/cart" className="ml-4 px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-gray-800 transition-all">
                View Cart
              </Link>
           </div>
        </div>
      )}
    </div>
  );
}

const LayoutGrid = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

