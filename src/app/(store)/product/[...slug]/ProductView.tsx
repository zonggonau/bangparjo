'use client';

import { parseProductName, parseProductImage, slugify } from '@/lib/cj-api';
import { calculateFinalPrice } from '@/lib/pricing';

function formatUSD(price: number | string) {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(p) ? '$0.00' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
}

/**
 * Find the longest common prefix across all variant names,
 * stopping at a word boundary (space). Used to strip the
 * repeated product name so only the unique part is shown.
 */
function stripCommonPrefix(names: string[]): string[] {
  if (names.length === 0) return [];
  if (names.length === 1) return names;

  // Find common character-level prefix
  let prefix = names[0];
  for (const name of names.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < name.length && prefix[i] === name[i]) i++;
    prefix = prefix.slice(0, i);
  }

  // Trim to the last word boundary so we don't cut mid-word
  const lastSpace = prefix.lastIndexOf(' ');
  const safeLen = lastSpace > 0 ? lastSpace : prefix.length;

  return names.map(n => n.slice(safeLen).trim() || n);
}
import Image from 'next/image';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useState, useEffect, use } from 'react';
import { ProductDetailSkeleton } from '@/components/ProductSkeleton';
import styles from './product.module.css';

export default function ProductView({ id, initialData, initialError }: { id: string, initialData: any, initialError: string | null }) {
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const [product, setProduct] = useState<any>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [selectedImage, setSelectedImage] = useState<string>(() => {
    return initialData ? parseProductImage(initialData.bigImage) : '';
  });
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(() => {
    return (initialData?.variants?.length > 0) ? initialData.variants[0] : null;
  });
  const [showToast, setShowToast] = useState(false);
  const displayName = product ? parseProductName(product.productNameEn || product.productName) : '';

    // Initialize selected image and variant from initialData
  // Related products section removed



  // Fetch product from local DB (client-side fallback when no initialData)
  useEffect(() => {
    if (!id || initialData) return;

    setLoading(true);
    setError(null);

    fetch(`/api/pproduct?cjId=${encodeURIComponent(id)}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setProduct(res.data);
          setSelectedImage(parseProductImage(res.data.bigImage || res.data.productImage));
          if (res.data.variants?.length > 0) {
            setSelectedVariant(res.data.variants[0]);
          }
        } else {
          setError('Produk tidak ditemukan. Mungkin belum diimpor ke database.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[ProductView] Error:', err);
        setError('Gagal memuat produk.');
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const vImg = selectedVariant?.image || selectedVariant?.variantImage;
    if (vImg) {
      const variantImg = parseProductImage(vImg);
      if (variantImg && variantImg !== '/placeholder.png') {
        setSelectedImage(variantImg);
      }
    }

    // Update URL dynamically to include title and selected options for SEO
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

  // Dynamic price calculation based on selected variant
  const currentCjPrice = selectedVariant?.variantSellPrice 
    ? Number(selectedVariant.variantSellPrice)
    : (typeof product?.sellPrice === 'number' ? product?.sellPrice : parseFloat(String(product?.sellPrice)));
    
  const originalPrice = calculateFinalPrice(currentCjPrice, settings);

  useEffect(() => {
    if (selectedVariant?.vid) {
      const timer = setTimeout(async () => {
        setShippingLoading(true);
        try {
          const sku = selectedVariant.variantSku || selectedVariant.vid;
          const res = await fetch(`/api/shipping-rates?sku=${sku}&quantity=1&country=ID&subtotal=${originalPrice}`);
          const data = await res.json();
          if (data.success) {
            setShippingRates(data.data);
          }
        } catch (err) {
          console.error('Failed to fetch shipping:', err);
        } finally {
          setShippingLoading(false);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    }
  }, [selectedVariant?.vid, originalPrice]);

  const handleAddToCart = () => {
    // Pass the selected variant so checkout can send a valid vid to CJ API
    const variantInfo = selectedVariant
      ? { 
          vid: selectedVariant.vid, 
          sku: selectedVariant.variantSku,
          name: selectedVariant.variantNameEn || selectedVariant.variantKey 
        }
      : undefined;

    // Fix NaN issue by overriding product sellPrice with normalized value
    const normalizedPrice = selectedVariant?.variantSellPrice 
      ? selectedVariant.variantSellPrice 
      : (typeof product.sellPrice === 'number' ? product.sellPrice : parseFloat(String(product.sellPrice)));

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
    <div style={{ minHeight: '100vh' }}>
      <ProductDetailSkeleton />
    </div>
  );


  if (error) {
    const isRateLimit = error.toLowerCase().includes('too many') || error.toLowerCase().includes('qps') || error.toLowerCase().includes('terlalu');
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorIcon}>{isRateLimit ? '⏳' : '😕'}</div>
        <h1>{isRateLimit ? 'Too Many Requests' : 'Product Not Found'}</h1>
        <p>{isRateLimit ? 'The server is busy. Please wait a moment and try again.' : `Sorry, product with ID ${id} was not found or is not available for your region.`}</p>
        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{error}</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {isRateLimit && (
            <button
              className={styles.backBtn}
              onClick={() => window.location.reload()}
              style={{ border: 'none', cursor: 'pointer' }}
            >
              🔄 Try Again
            </button>
          )}
          <Link href="/" className={styles.backBtn} style={{ background: 'var(--gray-600)' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }


  if (!product) return (
    <div className={styles.errorPage}>
      <div className={styles.errorIcon}>📭</div>
      <h1>Product Unavailable</h1>
      <Link href="/" className={styles.backBtn}>← Back to Home</Link>
    </div>
  );

  // Build deduplicated image list — bigImage always first (cover)
  const allImages = (() => {
    const raw = [
      product.bigImage,
      ...(product.productImageSet || []),
      ...(typeof product.productImage === 'string' && product.productImage.startsWith('[') ?
          (() => { try { return JSON.parse(product.productImage); } catch { return []; } })() :
          [product.productImage]),
    ]
      .map((img: any) => parseProductImage(img))
      .filter((img: string) => img && img !== '/placeholder.png');

    const seen = new Set<string>();
    return raw.filter((img: string) => {
      if (seen.has(img)) return false;
      seen.add(img);
      return true;
    }).slice(0, 6);
  })();

  const discountPct = 15;
  
  const originalPriceHigher = originalPrice * (1 + discountPct / 100);


  return (
    <div className={styles.page}>

      {/* Product Layout */}
      <div className="container">
        <div className={styles.productLayout}>
          {/* Image Gallery */}
          <div className={styles.gallery}>
            {/* Main Image — wrapped for consistent square sizing */}
            <div className={styles.mainImageWrapper}>
              <div className={styles.mainImage}>
                {selectedImage && (
                  <ProductImage
                    src={selectedImage}
                    alt={displayName}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={true}
                    style={{ objectFit: 'contain' }}
                  />
                )}
                {/* Badge wrapper excluded from .mainImage > * inset rule */}
                <div className={styles.badgeWrapper}>
                  <div className={styles.discountTag}>-{discountPct}%</div>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className={styles.thumbnails}>
                {allImages.map((img: string, i: number) => (
                  <button
                    key={img}
                    className={`${styles.thumbnail} ${selectedImage === img ? styles.thumbnailActive : ''}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <ProductImage src={img} alt={`${displayName} ${i + 1}`} fill sizes="80px" unoptimized={true} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className={styles.details}>
            <h1 className={styles.title}>{displayName}</h1>

            {/* Rating */}
            <div className={styles.ratingRow}>
              <span className={styles.stars}>★★★★☆</span>
              <span className={styles.ratingCount}>4.5 (128 reviews)</span>
              <span className={styles.sold}>| 1.2K+ sold</span>
            </div>

            {/* Price */}
            <div className={styles.priceSection}>
              <div className={styles.price}>{formatUSD(originalPrice)}</div>
              <div className={styles.priceRow}>
                <span className={styles.originalPrice}>{formatUSD(originalPriceHigher)}</span>
                <span className={styles.discountBadge}>Save {discountPct}%</span>
              </div>
              <p className={styles.usdPrice}>Price in USD · Worldwide shipping available</p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (() => {
              const allVariants = product.variants;
              const rawNames: string[] = allVariants.map((v: any) => v.variantNameEn || v.variantKey || '');
              const shortLabels = stripCommonPrefix(rawNames);

              return (
                <div className={styles.variantSection}>
                  <h3 className={styles.variantLabel}>
                    Options
                    {selectedVariant && (
                      <span className={styles.selectedVariantLabel}>
                        — {shortLabels[allVariants.findIndex((v: any) => v.vid === selectedVariant.vid)] || ''}
                      </span>
                    )}
                  </h3>
                  <div className={styles.variantList}>
                    {allVariants.map((variant: any, idx: number) => {
                      const isActive = selectedVariant?.vid === variant.vid;
                      const label = shortLabels[idx] || variant.variantNameEn || variant.variantKey;
                      return (
                        <button
                          key={variant.vid}
                          className={`${styles.variantItem} ${isActive ? styles.variantItemActive : ''}`}
                          onClick={() => setSelectedVariant(variant)}
                          title={rawNames[idx]}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem' }}
                        >
                          {(variant.image || variant.variantImage) && (
                            <div style={{ width: '24px', height: '24px', position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                              <img 
                                src={parseProductImage(variant.image || variant.variantImage)} 
                                alt={label} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            </div>
                          )}
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Shipping Info */}
            <div className={styles.shippingInfo}>
              <div className={styles.shippingHeader}>
                <span className={styles.shippingIcon}>🚚</span>
                <div>
                  <strong>Worldwide Shipping</strong>
                  {shippingLoading ? (
                    <p className={styles.loadingText}>Calculating rates...</p>
                  ) : shippingRates.length > 0 ? (
                    <p className={styles.shippingSummary}>
                      Starting from <strong>{shippingRates[0].formattedPrice}</strong> ({shippingRates[0].estimatedDays})
                    </p>
                  ) : (
                    <p className={styles.errorText}>No shipping methods available</p>
                  )}
                </div>
              </div>
              
              {!shippingLoading && shippingRates.length > 0 && (
                <div className={styles.shippingMethodsList}>
                   {shippingRates.slice(0, 2).map((rate) => (
                     <div key={rate.logisticName} className={styles.shippingMethodItem}>
                        <span>{rate.logisticName}</span>
                        <span>{rate.formattedPrice}</span>
                     </div>
                   ))}
                </div>
              )}

              <div className={styles.shippingItem}>
                <span>🔒</span>
                <span>Secure &amp; encrypted payment</span>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button 
                className={`${styles.cartButton} ${added ? styles.cartButtonAdded : ''}`}
                onClick={handleAddToCart}
              >
                {added ? '✅ Added!' : '🛒 Add to Cart'}
              </button>
              <Link 
                href={`/checkout?pid=${id}${selectedVariant ? `&vid=${selectedVariant.vid}` : ''}`} 
                className={styles.buyButton}
              >
                ⚡ Buy Now
              </Link>
            </div>

            {/* Trust Badges */}
            <div className={styles.trustBadges}>
              {['✅ Genuine Product', '🔒 Secure Payment', '📞 24/7 Support', '🌍 Worldwide Shipping'].map(b => (
                <span key={b} className={styles.trustBadge}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className={styles.description}>
            <h2 className={styles.descTitle}>Product Description</h2>
            <div 
              className={styles.descContent}
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: '#10b981',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          zIndex: 9999,
          animation: 'fadeInUp 0.3s ease-out forwards',
        }}>
          <span style={{ fontSize: '1.25rem' }}>✅</span>
          Product added to cart!
        </div>
      )}
    </div>
  );
}
