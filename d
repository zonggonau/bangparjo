'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CJShippingMethod, parseProductName, parseProductImage } from '@/lib/cj-utils';
import { calculateFinalPrice, calculateShippingFee } from '@/lib/pricing';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import Image from 'next/image';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';

function formatUSD(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

import { countries as COUNTRIES } from '@/lib/countries';

type CouponEntry = {
  code: string;
  applied: any | null;
  error: string;
  loading: boolean;
  discountAmount: number;
  freeShipping: boolean;
};

function makeCouponEntry(code = ''): CouponEntry {
  return { code, applied: null, error: '', loading: false, discountAmount: 0, freeShipping: false };
}

function itemKey(pid: string, vid?: string) {
  return `${pid}__${vid || 'novid'}`;
}

// ── CouponField: standalone component with local input state ──────────────
function CouponField({
  entry,
  onApply,
  onRemove,
}: {
  entry: CouponEntry;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const [localCode, setLocalCode] = useState(entry.applied ? entry.applied.code : entry.code);

  // Sync localCode when entry is reset (e.g. remove)
  useEffect(() => {
    if (!entry.applied) {
      setLocalCode('');
    }
  }, [entry.applied]);

  if (entry.applied) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-[6px] p-2 flex items-center gap-2">
        <i className="fas fa-tag text-green-600 text-[10px]"></i>
        <span className="text-[11px] font-bold text-green-700 flex-1 truncate">{entry.applied.code}</span>
        <button type="button" onClick={onRemove} className="text-green-600 hover:text-green-800 text-[10px] font-bold shrink-0">
          <i className="fas fa-times"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      <input
        type="text"
        placeholder="Coupon"
        value={localCode}
        onChange={e => setLocalCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onApply(localCode))}
        className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-[6px] text-[11px] outline-none focus:border-[#FF6B00] transition-colors"
      />
      <button
        type="button"
        onClick={() => onApply(localCode)}
        disabled={entry.loading || !localCode.trim()}
        className="px-2.5 py-1.5 rounded-[6px] text-[11px] font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {entry.loading ? <i className="fas fa-spinner fa-spin"></i> : 'Apply'}
      </button>
    </div>
  );
}

function CheckoutContent() {

  // ── SEO: Checkout pages must never be indexed ────────────────────────────
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    const prev = meta.getAttribute('content');
    meta.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (meta && meta.getAttribute('content') === 'noindex, nofollow') {
        meta.setAttribute('content', prev || 'index, follow');
      }
    };
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [shippingMethods, setShippingMethods] = useState<CJShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<CJShippingMethod | null>(null);
  const [fetchingShipping, setFetchingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [countryTouched, setCountryTouched] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  
  // ── Per-Product Coupon State ──────────────────────────────────────────────
  const [couponMap, setCouponMap] = useState<Record<string, CouponEntry>>({});
  // ── Track which product PIDs have coupons assigned (fetched from backend) ─
  const [productCouponPids, setProductCouponPids] = useState<Set<string>>(new Set());
  const [fetchingCouponProducts, setFetchingCouponProducts] = useState(true);

  // Fetch the list of product PIDs that have coupon assignments
  useEffect(() => {
    const fetchCouponProducts = async () => {
      try {
        const res = await fetch('/api/coupon/product-coupons');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProductCouponPids(new Set(json.data));
        }
      } catch (err) {
        console.error('[Checkout] Failed to fetch coupon products:', err);
      } finally {
        setFetchingCouponProducts(false);
      }
    };
    fetchCouponProducts();
  }, []);

  // Check if a specific product pid has coupons
  const hasCouponForProduct = (pid: string): boolean => {
    return productCouponPids.size === 0 || productCouponPids.has(pid);
  };

  const getCouponEntry = (key: string): CouponEntry => couponMap[key] || makeCouponEntry();

  const updateCouponEntry = (key: string, partial: Partial<CouponEntry>) => {
    setCouponMap(prev => ({
      ...prev,
      [key]: { ...(prev[key] || makeCouponEntry()), ...partial },
    }));
  };

  // ── Coupon Handlers ───────────────────────────────────────────────────────
  const handleApplyCoupon = async (key: string, code: string, productPid: string) => {
    if (!code.trim()) return;

    updateCouponEntry(key, { code, loading: true, error: '', applied: null });

    // Find the item price for this key
    let itemSubtotal = 0;
    if (isCartCheckout) {
      const [pid, vidRaw] = key.split('__');
      const vid = vidRaw === 'novid' ? undefined : vidRaw;
      const item = cartItems.find(i => i.pid === pid && (i.selectedVid || undefined) === vid);
      if (item) {
        const rawCj = Number(item.sellPrice);
        const price = isNaN(rawCj) ? 0 : calculateFinalPrice(rawCj, settings);
        itemSubtotal = price * item.quantity;
      }
    } else if (product) {
      itemSubtotal = variantPrice * qty;
    }

    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal: itemSubtotal, productPid }),
      });
      const json = await res.json();

      if (json.success) {
        updateCouponEntry(key, {
          applied: json.data,
          discountAmount: json.data.discountAmount,
          freeShipping: json.data.freeShipping,
          error: '',
          loading: false,
        });
      } else {
        updateCouponEntry(key, {
          error: json.error || 'Invalid coupon',
          discountAmount: 0,
          freeShipping: false,
          loading: false,
        });
      }
    } catch (err: any) {
      updateCouponEntry(key, {
        error: 'Failed to validate coupon',
        discountAmount: 0,
        freeShipping: false,
        loading: false,
      });
    }
  };

  const handleRemoveCoupon = (key: string) => {
    setCouponMap(prev => ({
      ...prev,
      [key]: makeCouponEntry(),
    }));
  };

  // If coming from cart (no pid param and items in cart)

  const isCartCheckout = !pidParam && cartItems.length > 0;

  // Load anchor product details from local DB
  useEffect(() => {
    const targetId = pidParam || (cartItems.length > 0 ? cartItems[0].pid : null);
    setProductError(null);
    
    if (!pidParam && cartItems.length > 0) {
      const firstItem = cartItems[0];
      setProduct({
        pid: firstItem.pid,
        productNameEn: firstItem.productNameEn || firstItem.productName,
        productName: firstItem.productName,
        bigImage: firstItem.bigImage || firstItem.productImage,
        productImage: firstItem.productImage,
        sellPrice: firstItem.sellPrice,
      });
      if (firstItem.selectedVid) {
        setSelectedVariant({
          vid: firstItem.selectedVid,
          variantSellPrice: firstItem.sellPrice,
          variantSku: firstItem.selectedSku,
          variantNameEn: firstItem.selectedVariantName,
          variantKey: firstItem.selectedVariantName || 'default',
        });
      }
      setSubmitError('');
      return;
    }

    if (targetId) {
      fetch(`/api/pproduct?cjId=${encodeURIComponent(targetId)}`)
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
            setProduct(res.data);
            if (vidParam) {
              const found = res.data.variants.find((v: any) => v.vid === vidParam);
              if (found) setSelectedVariant(found);
            } else if (res.data.variants?.length > 0) {
              setSelectedVariant(res.data.variants[0]);
            }
            setSubmitError('');
          } else {
            setProductError('⚠️ Product not found in database.');
          }
        })
        .catch(err => {
          setProductError('❌ Failed to load product data.');
        });
    }
  }, [pidParam, vidParam]);

  // Fetch shipping
  useEffect(() => {
    if (!product || !countryTouched) return;

    const vid = selectedVariant?.vid || (isCartCheckout ? cartItems[0]?.selectedVid : null);
    if (!vid && !isCartCheckout) {
      setShippingError('Shipping rates cannot be calculated for this item.');
      return;
    }

    const timer = setTimeout(() => {
      setFetchingShipping(true);
      setShippingError('');
      setShippingMethods([]);
      setSelectedShipping(null);

      const buildSkuQuery = () => {
        if (isCartCheckout) {
          const params = new URLSearchParams();
          cartItems.forEach((item, i) => {
            const sku = item.selectedSku || item.selectedVid || item.pid;
            params.append('sku', sku);
            params.append('quantity', String(item.quantity));
          });
          params.set('country', formData.country);
          params.set('subtotal', String(cartItems.reduce((acc, item) => acc + Number(item.sellPrice) * item.quantity, 0)));
          return params.toString();
        }
        const sku = selectedVariant?.variantSku || selectedVariant?.vid;
        return `sku=${encodeURIComponent(sku)}&quantity=${qty}&country=${encodeURIComponent(formData.country)}&subtotal=${subtotal}`;
      };

      fetch(`/api/shipping-rates?${buildSkuQuery()}`)
        .then(res => res.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setShippingMethods(res.data);
            setSelectedShipping(res.data[0]);
          } else {
            setShippingError('No shipping methods available for this destination.');
          }
        })
        .catch(() => {
          setShippingError('Failed to calculate shipping.');
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

      const variantCjPrice = selectedVariant?.variantSellPrice || (product ? product.sellPrice : 0);
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
          couponCode: null,
        })
      });

      const dbJson = await dbRes.json();
      if (dbJson.success && dbJson.order) {
        // Redirect to secure payment page
        router.push(`/checkout/${orderNum}?id=${dbJson.order.checkoutToken}`);
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

  if (!isLoaded) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-4">⏳</div>
        <p className="text-gray-500">Loading checkout...</p>
      </div>
    </div>
  );

  if ((pidParam || cartItems.length > 0) && productError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-[480px] p-8">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-3 text-[#1A1A1A]">Product Not Found</h2>
          <p className="text-gray-500 mb-6">{productError}</p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline">← Return Home</Link>
        </div>
      </div>
    );
  }

  if ((pidParam || cartItems.length > 0) && !product) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-4">⏳</div>
        <p className="text-gray-500">Loading checkout data...</p>
      </div>
    </div>
  );

  if (!pidParam && cartItems.length === 0) return (
    <div className="text-center py-20 px-5">
      <div className="text-6xl mb-6 opacity-30">🛒</div>
      <h2 className="text-[28px] font-bold mb-4 text-[#1A1A1A]">Your cart is empty</h2>
      <p className="text-gray-500 mb-8">Looks like you haven't added anything to checkout yet.</p>
      <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline">Start Shopping</Link>
    </div>
  );

  const variantCjPrice = selectedVariant?.variantSellPrice || (product ? product.sellPrice : 0);
  const variantPrice = calculateFinalPrice(variantCjPrice, settings);

  const cartSubtotal = isCartCheckout
    ? cartItems.reduce((acc, item) => {
        const rawCj = Number(item.sellPrice);
        return acc + (isNaN(rawCj) ? 0 : calculateFinalPrice(rawCj, settings)) * item.quantity;
      }, 0)
    : variantPrice * qty;
  
  const finalShippingCost = selectedShipping 
    ? calculateShippingFee(selectedShipping.logisticPrice || 0, cartSubtotal, settings)
    : 0;
  
  const subtotal = cartSubtotal;
  const taxAmount = (subtotal * (settings.taxPct || 0)) / 100;
  
  // Sum all per-product discount amounts
  const totalDiscount = Object.values(couponMap).reduce((sum, entry) => sum + (entry.discountAmount || 0), 0);
  
  // Apply coupon discount to subtotal
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
  
  // If any coupon has freeShipping, override shipping cost to 0
  const anyFreeShipping = Object.values(couponMap).some(entry => entry.freeShipping);
  const effectiveShippingCost = anyFreeShipping ? 0 : finalShippingCost;
  
  const grandTotal = discountedSubtotal + effectiveShippingCost + taxAmount;

  return (
    <div className="max-w-[1400px] mx-auto px-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
        {/* Left: Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 border border-gray-200">
          <h1 className="text-[28px] font-black text-[#1A1A1A] mb-8">Checkout</h1>

          {/* Shipping Information */}
          <section className="mb-8">
            <h2 className="text-[18px] font-extrabold text-[#1A1A1A] mb-6 flex items-center gap-2">
              <i className="fas fa-shipping-fast text-[#FF6B00]"></i>
              Shipping Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.5px]">Full Name *</label>
                <input type="text" placeholder="John Doe" required onChange={e => setFormData({ ...formData, name: e.target.value })} className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.5px]">Email Address *</label>
                <input type="email" placeholder="john@example.com" required onChange={e => setFormData({ ...formData, email: e.target.value })} className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-4">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.5px]">Phone Number</label>
              <input type="tel" placeholder="+1 234 567 890" onChange={e => setFormData({ ...formData, phone: e.target.value })} className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5 mt-4">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.5px]">Street Address *</label>
              <input type="text" placeholder="123 Main Street, Apt 4B" required onChange={e => setFormData({ ...formData, address: e.target.value })} className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.5px]">City *</label>
                <input type="text" placeholder="New York" required onChange={e => setFormData({ ...formData, city: e.target.value })} className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.5px]">ZIP / Postal Code</label>
                <input type="text" placeholder="10001" onChange={e => setFormData({ ...formData, zip: e.target.value })} className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-4">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.5px]">🌍 Country *</label>
              <select value={formData.country} onChange={e => { setFormData({ ...formData, country: e.target.value }); setCountryTouched(true); }} required className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors bg-white">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </section>

          {/* Shipping Method */}
          <section id="shipping-section" className="mb-8">
            <h2 className="text-[18px] font-extrabold text-[#1A1A1A] mb-6 flex items-center gap-2">
              <i className="fas fa-truck text-[#FF6B00]"></i>
              Shipping Method
            </h2>
            {fetchingShipping ? (
              <div className="flex items-center gap-3 py-4 text-gray-500"><i className="fas fa-spinner fa-spin text-[#FF6B00]"></i> <span>Calculating shipping rates...</span></div>
            ) : shippingMethods.length > 0 ? (
              <div className="flex flex-col gap-3">
                {shippingMethods.map((method) => (
                  <label key={method.logisticName} className={`flex items-start gap-3 p-4 rounded-[10px] border-2 cursor-pointer transition-all duration-200 ${selectedShipping?.logisticName === method.logisticName ? 'border-[#FF6B00] bg-[#FFF8F0]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <input type="radio" name="shipping" checked={selectedShipping?.logisticName === method.logisticName} onChange={() => setSelectedShipping(method)} className="mt-0.5 accent-[#FF6B00]" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[15px] text-[#1A1A1A]">{method.logisticName}</span>
                        <span className="font-extrabold text-[#FF6B00]">
                          { calculateShippingFee(method.logisticPrice, cartSubtotal, settings) === 0
                            ? <span className="text-green-600">FREE</span> 
                            : formatUSD(calculateShippingFee(method.logisticPrice, cartSubtotal, settings)) }
                        </span>
                      </div>
                      <span className="text-[13px] text-gray-500">⏱ {method.logisticAging}{method.logisticAging && !method.logisticAging.includes('days') ? ' days' : ''} delivery</span>
                    </div>
                  </label>
                ))}
              </div>
            ) : shippingError ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-[10px] text-red-600 text-sm font-semibold">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{shippingError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-[10px] text-blue-600 text-sm font-semibold">
                <i className="fas fa-info-circle"></i>
                <span>Select a country above to see available shipping methods.</span>
              </div>
            )}
          </section>

          {submitError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-[10px] text-red-600 text-sm font-semibold mb-6">
              <i className="fas fa-exclamation-circle"></i>
              <span>{submitError}</span>
            </div>
          )}

          <button type="submit" className="w-full px-6 py-4 rounded-[8px] font-bold text-[16px] bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : selectedShipping ? `⚡ Place Order — ${formatUSD(grandTotal)}` : '⚡ Place Order'}
          </button>
        </form>

        {/* Right: Order Summary */}
        <aside className="bg-white  p-6 sm:p-8 border border-gray-200 sticky top-24">
          <h3 className="text-[18px] font-extrabold text-[#1A1A1A] mb-6">Order Summary</h3>
          <div className="max-h-[400px] overflow-y-auto mb-6 space-y-4">
            {isCartCheckout ? (
              cartItems.map(item => {
                const key = itemKey(item.pid, item.selectedVid);
                const entry = getCouponEntry(key);
                const name = parseProductName(item.productNameEn || item.productName);
                const itemPrice = calculateFinalPrice(Number(item.sellPrice), settings) * item.quantity;
                const itemDiscounted = Math.max(0, itemPrice - (entry.discountAmount || 0));
                const showCoupon = hasCouponForProduct(item.pid);
                return (
                  <div key={key} className="pb-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex gap-3">
                      <img src={item.bigImage || item.productImage} alt={name} className="w-16 h-16 rounded-[8px] object-cover shrink-0 bg-gray-50" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-semibold text-[#1A1A1A] truncate max-w-[180px]">{name}</h4>
                        {item.selectedVariantName && <p className="text-[11px] text-gray-500 mt-0.5">Variant: {item.selectedVariantName}</p>}
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[11px] text-gray-400">Qty: {item.quantity}</span>
                          <span className="text-[13px] font-bold text-[#FF6B00]">
                            {entry.discountAmount > 0 ? (
                              <><span className="line-through text-gray-400 mr-1">{formatUSD(itemPrice)}</span>{formatUSD(itemDiscounted)}</>
                            ) : formatUSD(itemPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Per-product coupon field - only if product has coupons */}
                    {showCoupon && (
                      <div className="mt-2 pl-[4.25rem]">
                        {entry.error && (
                          <p className="text-[10px] text-red-500 mb-1 flex items-center gap-1">
                            <i className="fas fa-exclamation-circle"></i>
                            {entry.error}
                          </p>
                        )}
                        <CouponField entry={entry} onApply={(code) => handleApplyCoupon(key, code, item.pid)} onRemove={() => handleRemoveCoupon(key)} />
                      </div>
                    )}
                  </div>
                );
              })
            ) : product ? (
              (() => {
                const key = itemKey(product.pid || product.cjId);
                const entry = getCouponEntry(key);
                const name = parseProductName(product.productNameEn || product.productName);
                const itemPrice = variantPrice * qty;
                const itemDiscounted = Math.max(0, itemPrice - (entry.discountAmount || 0));
                const pid = product.pid || product.cjId;
                const showCoupon = hasCouponForProduct(pid);
                return (
                  <div key={key} className="pb-4 border-b border-gray-100">
                    <div className="flex gap-3">
                      <img src={product.bigImage || product.productImage} alt={name} className="w-16 h-16 rounded-[8px] object-cover shrink-0 bg-gray-50" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-semibold text-[#1A1A1A] truncate max-w-[180px]">{name}</h4>
                        {selectedVariant && <p className="text-[11px] text-gray-500 mt-0.5">Variant: {selectedVariant.variantNameEn || selectedVariant.variantKey}</p>}
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[11px] text-gray-400">Qty: {qty}</span>
                          <span className="text-[13px] font-bold text-[#FF6B00]">
                            {entry.discountAmount > 0 ? (
                              <><span className="line-through text-gray-400 mr-1">{formatUSD(itemPrice)}</span>{formatUSD(itemDiscounted)}</>
                            ) : formatUSD(itemPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Per-product coupon field - only if product has coupons */}
                    {showCoupon && (
                      <div className="mt-2 pl-[4.25rem]">
                        {entry.error && (
                          <p className="text-[10px] text-red-500 mb-1 flex items-center gap-1">
                            <i className="fas fa-exclamation-circle"></i>
                            {entry.error}
                          </p>
                        )}
                        <CouponField entry={entry} onApply={(code) => handleApplyCoupon(key, code, pid)} onRemove={() => handleRemoveCoupon(key)} />
                      </div>
                    )}
                  </div>
                );
              })()
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-[#1A1A1A]">{formatUSD(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discount</span>
                <span className="font-semibold text-green-600">-{formatUSD(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="font-semibold text-[#1A1A1A]">
                {selectedShipping ? (
                  effectiveShippingCost === 0 ? (
                    <span className="text-green-600 font-bold">
                      {anyFreeShipping ? '🎉 FREE' : 'FREE'}
                    </span>
                  ) : formatUSD(effectiveShippingCost)
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax ({settings.taxPct || 0}%)</span>
              <span className="font-semibold text-[#1A1A1A]">{formatUSD(taxAmount)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-5 mt-5 border-t-2 border-gray-200">
            <span className="text-[18px] font-extrabold text-[#1A1A1A]">Total</span>
            <span className="text-[24px] font-black text-[#FF6B00]">{formatUSD(grandTotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
