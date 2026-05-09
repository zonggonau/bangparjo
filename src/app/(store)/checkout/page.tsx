'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProductDetails, getShippingFee, CJShippingMethod, parseProductName, parseProductImage } from '@/lib/cj-api';
import { calculateFinalPrice, calculateShippingFee } from '@/lib/pricing';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import Image from 'next/image';
import Link from 'next/link';
import PayPalButton from '@/components/PayPalButton';
import MidtransPayment from '@/components/MidtransPayment';
import styles from './checkout.module.css';

function formatUSD(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

import { countries as COUNTRIES } from '@/lib/countries';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const pidParam = searchParams.get('pid');
  const vidParam = searchParams.get('vid');
  
  const { items: cartItems, clearCart, isLoaded } = useCart();
  const { settings } = useSettings();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zip: '',
    country: 'US',
  });
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [finalItems, setFinalItems] = useState<any[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<CJShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<CJShippingMethod | null>(null);
  const [fetchingShipping, setFetchingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [countryTouched, setCountryTouched] = useState(false);

  // If coming from cart (no pid param and items in cart)
  const isCartCheckout = !pidParam && cartItems.length > 0;

  // Load anchor product details (either from param or first item in cart for shipping reference)
  useEffect(() => {
    const targetId = pidParam || (cartItems.length > 0 ? cartItems[0].pid : null);
    if (targetId) {
      getProductDetails(targetId).then(res => {
        if (res.success) {
          setProduct(res.data);
          if (vidParam) {
            const found = res.data.variants.find((v: any) => v.vid === vidParam);
            if (found) setSelectedVariant(found);
          } else if (res.data.variants?.length > 0) {
            setSelectedVariant(res.data.variants[0]);
          }
        }
      });
    }
  }, [pidParam, vidParam, cartItems.length]); // Added cartItems.length to handle refresh correctly

  // Fetch shipping ONLY after user has touched the country dropdown
  useEffect(() => {
    if (!product || !countryTouched) return;

    const vid = selectedVariant?.vid;
    if (!vid) {
      setShippingError('Shipping rates cannot be calculated for this item.');
      return;
    }

    const timer = setTimeout(() => {
      setFetchingShipping(true);
      setShippingError('');
      setShippingMethods([]);
      setSelectedShipping(null);

      getShippingFee({
        products: isCartCheckout 
          ? cartItems.map(item => ({ vid: item.selectedVid, quantity: item.quantity }))
          : [{ vid: selectedVariant?.vid, quantity: qty }],
        endCountryCode: formData.country,
      }).then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setShippingMethods(res.data);
          setSelectedShipping(res.data[0]);
        } else {
          // If the API returns success:true but an empty list, it usually means 
          // they don't ship this specific product to that country.
          const msg = (res.message && res.message !== 'Success') 
            ? res.message 
            : 'This product is unfortunately not available for shipping to the selected country. Please try a different destination or another product.';
          setShippingError(msg);
        }
      }).catch(() => {
        setShippingError('Failed to fetch shipping rates. Please check your connection or try again later.');
      }).finally(() => setFetchingShipping(false));
    }, 800);

    return () => clearTimeout(timer);
  }, [product, formData.country, selectedVariant, qty, countryTouched, isCartCheckout, cartItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!countryTouched || !selectedShipping) {
      setSubmitError(
        !countryTouched
          ? '⚠️ Please select your destination country to calculate shipping first.'
          : '⚠️ Please wait for shipping methods to load and select one.'
      );
      document.getElementById('shipping-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    confirmPayment();
  };

  const confirmPayment = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      const orderNum = `ORD-${Date.now()}`;
      const products = isCartCheckout
        ? cartItems.map(item => ({
            vid: item.selectedVid,
            sku: item.selectedSku || (item as any).productSku,
            quantity: item.quantity,
          }))
        : [{ vid: selectedVariant?.vid, sku: selectedVariant?.variantSku, quantity: qty }];

      const orderData = {
        orderNumber: orderNum,
        shippingCountryCode: formData.country,
        shippingCountry: COUNTRIES.find(c => c.code === formData.country)?.name || formData.country,
        shippingProvince: formData.province || formData.city,
        shippingCity: formData.city,
        shippingAddress: formData.address,
        shippingZip: formData.zip,
        shippingPhone: formData.phone,
        shippingCustomerName: formData.name,
        email: formData.email,
        logisticName: selectedShipping!.logisticName,
        fromCountryCode: 'CN',
        payType: 2,
        products,
      };

      const cartCost = isCartCheckout
        ? cartItems.reduce((acc, item) => acc + Number(item.sellPrice) * item.quantity, 0)
        : Number(variantCjPrice) * qty;
      const totalCost = cartCost + (selectedShipping?.logisticPrice || 0);

      const dbRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNum,
          customerEmail: formData.email,
          customerName: formData.name,
          customerPhone: formData.phone,
          totalAmount: grandTotal,
          costAmount: totalCost,
          status: 'UNPAID',
          orderData: JSON.stringify(orderData),
        })
      });

      const dbJson = await dbRes.json();
      if (dbJson.success) {
        setFinalAmount(grandTotal);
        const snapshot = isCartCheckout 
          ? cartItems.map(item => ({
              pid: item.pid,
              name: parseProductName(item.productNameEn || item.productName),
              img: parseProductImage(item.bigImage || item.productImage),
              variant: item.selectedVariantName,
              qty: item.quantity,
              price: calculateFinalPrice(Number(item.sellPrice), settings)
            }))
          : [{
              pid: product.pid,
              name: parseProductName(product.productNameEn || product.productName),
              img: productImage,
              variant: selectedVariant?.variantNameEn || selectedVariant?.variantKey,
              qty: qty,
              price: variantPrice
            }];
        
        setFinalItems(snapshot);
        setOrderId(orderNum);
        if (isCartCheckout) clearCart();
      } else {
        throw new Error(dbJson.error || 'Failed to save order');
      }
    } catch (err: any) {
      console.error('[Checkout] Error:', err);
      setSubmitError('❌ ' + (err.message || 'An unexpected error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || ((pidParam || cartItems.length > 0) && !product && !orderId)) return (
    <div className={styles.container} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading checkout...</p>
      </div>
    </div>
  );

  if (!pidParam && cartItems.length === 0 && !orderId) return (
    <div className={styles.container} style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛒</div>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Your cart is empty</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Looks like you haven&apos;t added anything to checkout yet.</p>
      <Link href="/" className={styles.submitButton} style={{ textDecoration: 'none', padding: '1rem 2.5rem', display: 'inline-block' }}>
        Start Shopping
      </Link>
    </div>
  );

  const productImage = product ? parseProductImage(product.bigImage || product.productImage) : '';
  const productCjPrice = product ? (typeof product.sellPrice === 'number' ? product.sellPrice : parseFloat(String(product.sellPrice))) : 0;
  const variantCjPrice = selectedVariant?.variantSellPrice || (product ? product.sellPrice : 0);
  const variantPrice = calculateFinalPrice(variantCjPrice, settings);

  const cartSubtotal = isCartCheckout
    ? cartItems.reduce((acc, item) => {
        const rawCj = Number(item.sellPrice);
        return acc + (isNaN(rawCj) ? 0 : calculateFinalPrice(rawCj, settings)) * item.quantity;
      }, 0)
    : variantPrice * qty;
  
  // Apply shipping markup and free shipping threshold consistently
  const finalShippingCost = selectedShipping 
    ? calculateShippingFee(selectedShipping.logisticPrice || 0, cartSubtotal, settings)
    : 0;
  
  const subtotal = cartSubtotal;
  const taxAmount = (subtotal * (settings.taxPct || 0)) / 100;
  const grandTotal = subtotal + finalShippingCost + taxAmount;

  if (orderId) {
    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('Account number copied to clipboard!');
    };

    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successHeader}>
            <div className={styles.statusIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 className={styles.successTitle}>{isPaid ? 'Payment Confirmed' : 'Order Placed Successfully'}</h1>
            <div className={styles.orderBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              Order #{orderId}
            </div>
          </div>

          <div className={styles.successContent}>
            {isPaid ? (
              <div className={styles.paidMessage}>
                <h3>Thank you for your purchase!</h3>
                <p>We&apos;ve received your payment and our team is currently processing your order. You will receive an email update with tracking information once your package ships.</p>
              </div>
            ) : (
              <div className={styles.paymentSection}>
                <div className={styles.successOrderList}>
                  <p className={styles.orderListTitle}>Items in Order:</p>
                  {finalItems.map((item, idx) => (
                    <div key={`${item.pid}-${idx}`} className={styles.successOrderItem}>
                      <div className={styles.successOrderImg}>
                        <Image src={item.img} alt={item.name} fill sizes="40px" unoptimized style={{ objectFit: 'contain' }} />
                      </div>
                      <div className={styles.successOrderInfo}>
                        <p className={styles.successOrderName}>{item.name}</p>
                        {item.variant && <p className={styles.successOrderVariant}>Variant: {item.variant}</p>}
                        <p className={styles.successOrderQty}>Qty: {item.qty} &nbsp;·&nbsp; {formatUSD(item.price * item.qty)}</p>
                      </div>
                    </div>
                  ))}
                  <div className={styles.successOrderTotal}>
                    <span>Total Amount</span>
                    <strong>{formatUSD(finalAmount)}</strong>
                  </div>
                </div>

                <div className={styles.paymentIntro}>
                  <h3>Finalize Your Payment</h3>
                  <p>Choose your preferred payment method below to complete the order.</p>
                </div>

                <div className={styles.paymentGrid} style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                  {/* Midtrans - Only for Indonesia */}
                  {formData.country === 'ID' && (
                    <div className={styles.methodGroup} style={{ maxWidth: '480px', width: '100%' }}>
                      <span className={styles.methodLabel}>🇮🇩 Pembayaran Lokal (VA, QRIS, Kartu)</span>
                      <MidtransPayment 
                        orderId={orderId!} 
                        amount={finalAmount} 
                        customerDetails={{
                          name: formData.name,
                          email: formData.email,
                          phone: formData.phone
                        }}
                        onSuccess={() => setIsPaid(true)} 
                      />
                    </div>
                  )}

                  {/* PayPal - Global & Indonesia */}
                  <div className={styles.methodGroup} style={{ maxWidth: '480px', width: '100%' }}>
                    <span className={styles.methodLabel}>🌎 Global Payment (PayPal / Credit Card)</span>
                    <PayPalButton 
                      amount={finalAmount} 
                      orderId={orderId!} 
                      onSuccess={() => setIsPaid(true)} 
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
                      Secure encryption. Instant confirmation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.successFooter}>
            <Link href="/" className={styles.secondaryLink}>← Return to Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Checkout</h1>
      <div className={styles.layout}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <section className={styles.formSection}>
            <h3 className={styles.sectionTitle}>📦 Shipping Information</h3>
            <div className={styles.formGrid2}>
              <label className={styles.label}>Full Name *
                <input type="text" className={styles.input} placeholder="John Doe" required onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </label>
              <label className={styles.label}>Email Address *
                <input type="email" className={styles.input} placeholder="john@example.com" required onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </label>
            </div>
            <label className={styles.label}>Phone Number
              <input type="tel" className={styles.input} placeholder="+1 234 567 890" onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </label>
            <label className={styles.label}>Street Address *
              <input type="text" className={styles.input} placeholder="123 Main Street, Apt 4B" required onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </label>
            <div className={styles.formGrid3}>
              <label className={styles.label}>City *
                <input type="text" className={styles.input} placeholder="New York" required onChange={e => setFormData({ ...formData, city: e.target.value })} />
              </label>
              <label className={styles.label}>State / Province
                <input type="text" className={styles.input} placeholder="NY" onChange={e => setFormData({ ...formData, province: e.target.value })} />
              </label>
              <label className={styles.label}>ZIP / Postal Code
                <input type="text" className={styles.input} placeholder="10001" onChange={e => setFormData({ ...formData, zip: e.target.value })} />
              </label>
            </div>
            <label className={styles.label}>🌍 Country *
              <select className={styles.input} value={formData.country} onChange={e => { setFormData({ ...formData, country: e.target.value }); setCountryTouched(true); }} required>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </label>
          </section>

          <section id="shipping-section" className={styles.formSection}>
            <h3 className={styles.sectionTitle}>🚚 Shipping Method</h3>
            {fetchingShipping ? (
              <div className={styles.shippingLoading}><div className={styles.spinnerSmall} /><span>Calculating shipping rates...</span></div>
            ) : shippingMethods.length > 0 ? (
              <div className={styles.shippingList}>
                {shippingMethods.map((method) => (
                  <label key={method.logisticName} className={`${styles.shippingOption} ${selectedShipping?.logisticName === method.logisticName ? styles.shippingOptionActive : ''}`}>
                    <input type="radio" name="shipping" checked={selectedShipping?.logisticName === method.logisticName} onChange={() => setSelectedShipping(method)} />
                    <div className={styles.shippingOptionInfo}>
                      <span className={styles.shippingName}>{method.logisticName}</span>
                      <span className={styles.shippingAging}>⏱ {method.logisticAging}{method.logisticAging && !method.logisticAging.includes('days') ? ' days' : ''}</span>
                    </div>
                    <span className={styles.shippingPrice}>
                      { calculateShippingFee(method.logisticPrice, cartSubtotal, settings) === 0
                        ? <span className={styles.freeShipping}>FREE</span> 
                        : formatUSD(calculateShippingFee(method.logisticPrice, cartSubtotal, settings)) }
                    </span>
                  </label>
                ))}
              </div>
            ) : shippingError ? (
              <p className={styles.shippingError}>⚠️ {shippingError}</p>
            ) : (
              <p className={styles.shippingHint}>📍 Select a country above to see available shipping methods.</p>
            )}
          </section>

          {submitError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.875rem 1rem', color: '#DC2626', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>{submitError}</div>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? '⏳ Processing...' : selectedShipping ? `⚡ Place Order — ${formatUSD(grandTotal)}` : '⚡ Place Order'}
          </button>
        </form>

        <aside className={styles.summary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>
          {isCartCheckout ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cartItems.map(item => (
                <div key={`${item.pid}-${item.selectedVid || 'no-vid'}`} className={styles.summaryProduct}>
                  <div className={styles.summaryImg}>
                    <Image src={parseProductImage(item.bigImage || item.productImage)} alt={parseProductName(item.productNameEn || item.productName)} fill sizes="64px" unoptimized style={{ objectFit: 'contain' }} />
                  </div>
                  <div className={styles.summaryInfo}>
                    <p className={styles.summaryName}>{parseProductName(item.productNameEn || item.productName)}</p>
                    {item.selectedVariantName && <p className={styles.summaryVariant}>{item.selectedVariantName}</p>}
                    <p className={styles.qtyRow}><span className={styles.summaryQty}>Qty: {item.quantity}</span><span className={styles.summaryPrice}>{formatUSD(calculateFinalPrice(Number(item.sellPrice), settings) * item.quantity)}</span></p>
                  </div>
                </div>
              ))}
            </div>
          ) : product ? (
            <div className={styles.summaryProduct}>
              <div className={styles.summaryImg}>
                <Image src={productImage} alt={parseProductName(product.productNameEn || product.productName)} fill sizes="80px" unoptimized style={{ objectFit: 'contain' }} />
              </div>
              <div className={styles.summaryInfo}>
                <p className={styles.summaryName}>{parseProductName(product.productNameEn || product.productName)}</p>
                {selectedVariant && <p className={styles.summaryVariant}>{selectedVariant.variantNameEn || selectedVariant.variantKey}</p>}
                <p className={styles.summaryQty}>Qty: {qty}</p>
              </div>
            </div>
          ) : null}
          <div className={styles.divider} />
          <div className={styles.priceRow}><span>Subtotal</span><span>{formatUSD(subtotal)}</span></div>
          <div className={styles.priceRow}>
            <span>Shipping</span>
            <span>{selectedShipping ? (finalShippingCost === 0 ? <span className={styles.freeShipping}>FREE</span> : formatUSD(finalShippingCost)) : '—'}</span>
          </div>
          <div className={styles.priceRow}>
            <span>Tax ({settings.taxPct || 0}%)</span>
            <span>{formatUSD(taxAmount)}</span>
          </div>
          <div className={styles.divider} />
          <div className={`${styles.priceRow} ${styles.totalRow}`}><span>Total</span><span>{formatUSD(grandTotal)}</span></div>
          <div className={styles.trustBox}>
            <div className={styles.trustItem}>🔒 Secure checkout</div>
            <div className={styles.trustItem}>🌍 Ships to 200+ countries</div>
            <div className={styles.trustItem}>↩️ 30-day returns</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
