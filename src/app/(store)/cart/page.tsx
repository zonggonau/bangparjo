'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { parseProductName, parseProductImage } from '@/lib/cj-utils';
import { calculateFinalPrice, calculateShippingFee } from '@/lib/pricing';
import Link from 'next/link';

function formatUSD(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalItems, isLoaded } = useCart();
  const { settings } = useSettings();

  const subtotal = items.reduce((acc, item) => {
    const rawCjPrice = Number(item.sellPrice);
    const price = isNaN(rawCjPrice) ? 0 : calculateFinalPrice(rawCjPrice, settings);
    return acc + price * item.quantity;
  }, 0);

  const [shippingEstimate, setShippingEstimate] = useState<number>(0);
  const [isFetchingShipping, setIsFetchingShipping] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      setShippingEstimate(0);
      return;
    }

    const fetchShipping = async () => {
      setIsFetchingShipping(true);
      try {
        const params = new URLSearchParams();
        items.forEach(it => {
          const sku = it.selectedSku || it.selectedVid || it.pid;
          params.append('sku', sku);
          params.append('quantity', String(it.quantity));
        });
        params.set('country', 'US');
        params.set('subtotal', String(subtotal));

        const res = await fetch(`/api/shipping-rates?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          setShippingEstimate(data.data[0].logisticPrice);
        } else {
          setShippingEstimate(subtotal >= (settings.freeShippingThreshold || 50) ? 0 : 5.99);
        }
      } catch (err) {
        setShippingEstimate(subtotal >= (settings.freeShippingThreshold || 50) ? 0 : 5.99);
      } finally {
        setIsFetchingShipping(false);
      }
    };

    const timer = setTimeout(fetchShipping, 500);
    return () => clearTimeout(timer);
  }, [items, subtotal, settings.freeShippingThreshold]);

  const finalShipping = calculateShippingFee(shippingEstimate, subtotal, settings);
  const taxAmount = (subtotal * (settings.taxPct || 0)) / 100;
  const grandTotal = subtotal + finalShipping + taxAmount - couponDiscount;

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    const coupons: Record<string, number> = {
      'WELCOME10': 10,
      'SAVE20': 20,
      'FREESHIP': 0,
    };

    if (code === 'FREESHIP') {
      setCouponDiscount(finalShipping);
      setCouponMsg('🎉 Free shipping applied!');
      return;
    }

    if (coupons[code]) {
      const discount = (subtotal * coupons[code]) / 100;
      setCouponDiscount(discount);
      setCouponMsg(`🎉 ${coupons[code]}% discount applied!`);
    } else {
      setCouponDiscount(0);
      setCouponMsg('❌ Invalid coupon code');
    }
  };

  if (!isLoaded) return (
    <div className="text-center py-24">
      <i className="fas fa-spinner fa-spin fa-2x text-[#FF6B00]"></i>
    </div>
  );

  if (totalItems === 0) {
    return (
      <div className="text-center py-24">
        <div className="max-w-[1400px] mx-auto px-5">
          <div className="text-6xl mb-4 opacity-30">🛒</div>
          <h1 className="text-[28px] font-bold mb-3 text-[#1A1A1A]">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-2.5 rounded-md font-semibold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200">Browse Products</Link>
        </div>
      </div>
    );
  }

  const freeThreshold = settings.freeShippingThreshold || 50;
  const progressPct = Math.min((subtotal / freeThreshold) * 100, 100);
  const remaining = Math.max(freeThreshold - subtotal, 0);

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Link href="/" className="hover:text-[#FF6B00]">Home</Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-semibold">Shopping Cart</span>
        </div>
      </div>

      <section className="max-w-[1400px] mx-auto px-5">
        <h1 className="text-[32px] font-bold text-[#1A1A1A] mb-8">
          Shopping Cart <span className="text-base font-normal text-gray-500">({totalItems} items)</span>
        </h1>

        {subtotal < freeThreshold && (
          <div className="bg-gray-50 rounded-[10px] p-4 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
              <span className="text-sm font-semibold">
                🚚 Add <strong className="text-[#FF6B00]">{formatUSD(remaining)}</strong> more for <strong>FREE shipping</strong>
              </span>
              <span className="text-[13px] font-bold text-[#FF6B00]">{formatUSD(subtotal)} / {formatUSD(freeThreshold)}</span>
            </div>
            <div className="h-[6px] bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF6B00] rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {subtotal >= freeThreshold && (
          <div className="bg-green-50 rounded-[10px] p-4 mb-6 border border-green-200 text-green-600 font-bold text-sm">
            🎉 You qualify for <strong>FREE shipping</strong>!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-4">
            {items.map((item) => {
              const name = parseProductName(item.productNameEn || item.productName);
              const img = parseProductImage(item.bigImage || item.productImage);
              const rawCjPrice = Number(item.sellPrice);
              const price = isNaN(rawCjPrice) ? 0 : calculateFinalPrice(rawCjPrice, settings);

              return (
                <div key={`${item.pid}-${item.selectedVid || 'no-vid'}`} className="bg-white rounded-[10px] p-5 flex gap-5 border border-gray-200">
                  <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-50">
                    <img src={img} alt={name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{item.categoryName || 'Imported'}</p>
                    <h3 className="font-semibold text-[#1A1A1A] truncate">
                      <Link href={`/product/${item.pid}`} className="hover:text-[#FF6B00]">{name}</Link>
                    </h3>
                    {item.selectedVariantName && (
                      <p className="text-[13px] text-gray-500">{item.selectedVariantName}</p>
                    )}
                    <div className="text-[#FF6B00] font-bold mt-1">{formatUSD(price)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <button className="text-sm text-gray-400 hover:text-red-500 transition-colors" onClick={() => removeFromCart(item.pid, item.selectedVid)}>
                      <i className="far fa-trash-alt"></i> Remove
                    </button>
                    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                      <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors" onClick={() => updateQuantity(item.pid, item.quantity - 1, item.selectedVid)}>−</button>
                      <input type="number" value={item.quantity} readOnly className="w-10 h-8 text-center text-sm font-semibold border-x border-gray-200 outline-none" />
                      <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors" onClick={() => updateQuantity(item.pid, item.quantity + 1, item.selectedVid)}>+</button>
                    </div>
                    <div className="font-bold text-[#1A1A1A]">{formatUSD(price * item.quantity)}</div>
                  </div>
                </div>
              );
            })}

            <div className="bg-white rounded-[10px] p-5 border border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[#FF6B00]"
                />
                <button className="px-4 py-2.5 bg-[#FF6B00] text-white rounded-md text-sm font-semibold hover:bg-[#E06000] transition-colors" onClick={handleApplyCoupon}>Apply</button>
              </div>
              {couponMsg && (
                <p className={`text-[13px] mt-2 font-semibold ${couponMsg.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
                  {couponMsg}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">Try: WELCOME10, SAVE20, FREESHIP</p>
            </div>
          </div>

          <div className="bg-white rounded-[10px] p-6 border border-gray-200 h-fit sticky top-24">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-5">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">{formatUSD(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="font-semibold">
                  {isFetchingShipping ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : finalShipping === 0 ? (
                    <span className="text-green-600 font-bold">FREE</span>
                  ) : (
                    formatUSD(finalShipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({settings.taxPct || 0}%)</span>
                <span className="font-semibold">{formatUSD(taxAmount)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatUSD(couponDiscount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-[#1A1A1A]">Total</span>
                <span className="font-bold text-lg text-[#FF6B00]">{formatUSD(grandTotal)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block text-center mt-5 px-6 py-3 bg-[#FF6B00] text-white rounded-md font-semibold hover:bg-[#E06000] transition-all duration-200"
            >
              Proceed to Checkout
            </Link>
            <Link href="/#products" className="block text-center mt-3 text-sm text-gray-500 hover:text-[#FF6B00] transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
