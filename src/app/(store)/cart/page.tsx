'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { parseProductName, parseProductImage } from '@/lib/cj-api';
import { calculateFinalPrice, calculateShippingFee } from '@/lib/pricing';
import Image from 'next/image';
import Link from 'next/link';
import styles from './cart.module.css';

function formatUSD(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, isLoaded } = useCart();
  const { settings } = useSettings();

  const subtotal = items.reduce((acc, item) => {
    const rawCjPrice = Number(item.sellPrice);
    const price = isNaN(rawCjPrice) ? 0 : calculateFinalPrice(rawCjPrice, settings);
    return acc + price * item.quantity;
  }, 0);

  const [shippingEstimate, setShippingEstimate] = useState<number>(0);
  const [isFetchingShipping, setIsFetchingShipping] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setShippingEstimate(0);
      setIsFetchingShipping(false);
      return;
    }

    const fetchShipping = async () => {
      try {
        const products = items.map(it => ({ 
          vid: it.selectedVid, 
          quantity: it.quantity 
        }));
        
        const res = await fetch(`/api/shipping-rates?products=${encodeURIComponent(JSON.stringify(products))}&country=ID&subtotal=${subtotal}`);
        const data = await res.json();
        
        if (data.success && data.data?.length > 0) {
          setShippingEstimate(data.data[0].logisticPrice);
        } else {
          setShippingEstimate(subtotal >= settings.freeShippingThreshold ? 0 : (5.00 + (settings.shippingMarkup || 0)));
        }
      } catch (err) {
        console.error('Failed to fetch shipping estimate:', err);
        setShippingEstimate(subtotal >= settings.freeShippingThreshold ? 0 : (5.00 + (settings.shippingMarkup || 0)));
      } finally {
        setIsFetchingShipping(false);
      }
    };

    setIsFetchingShipping(true); // Set loading immediately when items change
    const timer = setTimeout(fetchShipping, 500);
    return () => clearTimeout(timer);
  }, [items, subtotal, settings.freeShippingThreshold, settings.shippingMarkup]);


  const grandTotal = subtotal + shippingEstimate;

  if (!isLoaded) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className={styles.spinnerSmall} style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className={styles.emptyPage}>
        <div className={styles.emptyIcon}>🛒</div>
        <h1 className={styles.emptyTitle}>Your cart is empty</h1>
        <p className={styles.emptyDesc}>
          Looks like you haven&apos;t added anything yet. Explore our catalog and find something you love!
        </p>
        <Link href="/" className={styles.continueShopping}>
          Browse Products →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Shopping Cart</h1>
            <p className={styles.subtitle}>{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
          </div>
          <button className={styles.clearBtn} onClick={clearCart}>
            🗑️ Clear All
          </button>
        </div>

        <div className={styles.layout}>
          {/* ── Cart Items ── */}
          <div className={styles.itemsCol}>
            {items.map((item) => {
              const name = parseProductName(item.productNameEn || item.productName);
              const img = parseProductImage(item.bigImage || item.productImage);
              const rawCjPrice = Number(item.sellPrice);
              const price = isNaN(rawCjPrice) ? 0 : calculateFinalPrice(rawCjPrice, settings);
              const lineTotal = price * item.quantity;

              return (
                <div key={`${item.pid}-${item.selectedVid || 'no-vid'}`} className={styles.cartItem}>
                  {/* Product Image */}
                  <Link href={`/product/${item.pid}`} className={styles.itemImg}>
                    <Image
                      src={img}
                      alt={name}
                      fill
                      sizes="100px"
                      unoptimized
                      style={{ objectFit: 'contain' }}
                    />
                  </Link>

                  {/* Product Info */}
                  <div className={styles.itemInfo}>
                    <span className={styles.itemCategory}>{item.categoryName}</span>
                    <Link href={`/product/${item.pid}`}>
                      <h3 className={styles.itemName}>{name}</h3>
                    </Link>
                    {item.selectedVariantName && (
                      <p className={styles.itemVariant}>
                        <strong>Variant:</strong> {item.selectedVariantName}
                      </p>
                    )}
                    <p className={styles.itemPrice}>{formatUSD(price)} each</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className={styles.qtyControls}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.pid, item.quantity - 1, item.selectedVid)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className={styles.qtyNum}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.pid, item.quantity + 1, item.selectedVid)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className={styles.lineTotal}>
                    <span className={styles.lineTotalAmount}>{formatUSD(lineTotal)}</span>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.pid, item.selectedVid)}
                      aria-label={`Remove ${name}`}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Continue Shopping */}
            <Link href="/" className={styles.continueLink}>
              ← Continue Shopping
            </Link>
          </div>

          {/* ── Order Summary Sidebar ── */}
          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            {/* Item list compact */}
            <div className={styles.summaryItems}>
              {items.map((item) => {
                const rawCjPrice = Number(item.sellPrice);
                const price = isNaN(rawCjPrice) ? 0 : calculateFinalPrice(rawCjPrice, settings);
                return (
                  <div key={`${item.pid}-${item.selectedVid || 'no-vid'}`} className={styles.summaryItem}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span className={styles.summaryItemName}>
                        {parseProductName(item.productNameEn || item.productName).substring(0, 35)}...
                      </span>
                      {item.selectedVariantName && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.selectedVariantName}</span>
                      )}
                    </div>
                    <span className={styles.summaryItemQty}>×{item.quantity}</span>
                    <span className={styles.summaryItemPrice}>
                      {formatUSD(price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={styles.divider} />

            {/* Pricing */}
            <div className={styles.priceRow}>
              <span>Subtotal</span>
              <span>{formatUSD(subtotal)}</span>
            </div>
             <div className={styles.priceRow}>
              <span>Estimated Shipping (ID)</span>
              <span>
                {isFetchingShipping ? (
                  <span className={styles.fetching}>Calculating...</span>
                ) : shippingEstimate === 0 ? (
                  <span className={styles.freeShipping}>FREE 🎉</span>
                ) : (
                  formatUSD(shippingEstimate)
                )}
              </span>
            </div>
            {subtotal < settings.freeShippingThreshold && subtotal > 0 && (
              <p className={styles.freeShippingHint}>
                🚚 Add <strong>{formatUSD(settings.freeShippingThreshold - subtotal)}</strong> more for free shipping!
              </p>
            )}

            <div className={styles.divider} />

            <div className={styles.totalRow}>
              <span>Total</span>
              <span>{formatUSD(grandTotal)}</span>
            </div>
            <p className={styles.taxNote}>Tax and final shipping calculated at checkout</p>

            <Link href="/checkout" className={styles.checkoutBtn}>
              ⚡ Checkout Now ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </Link>

            {/* Trust signals */}
            <div className={styles.trust}>
              <span>🔒 Secure Checkout</span>
              <span>🌍 Ships Worldwide</span>
              <span>↩️ 30-Day Returns</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
