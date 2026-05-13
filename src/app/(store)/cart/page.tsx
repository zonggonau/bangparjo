'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { parseProductName, parseProductImage } from '@/lib/cj-api';
import { calculateFinalPrice } from '@/lib/pricing';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  ChevronRight,
  Loader2,
  Package,
  ShoppingBag
} from 'lucide-react';

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

    setIsFetchingShipping(true);
    const timer = setTimeout(fetchShipping, 500);
    return () => clearTimeout(timer);
  }, [items, subtotal, settings.freeShippingThreshold, settings.shippingMarkup]);

  const grandTotal = subtotal + shippingEstimate;

  if (!isLoaded) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="container max-w-2xl px-6 text-center">
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/20 mx-auto mb-8 shadow-2xl">
            <ShoppingCart size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">Your cart is empty</h1>
          <p className="text-gray-400 mb-10 text-sm leading-relaxed max-w-md mx-auto font-medium">
            Looks like you haven&apos;t added any premium products yet. Start exploring our curated collection and find something extraordinary.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-2xl shadow-white/5"
          >
            <ShoppingBag size={20} /> Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft size={14} /> Continue Shopping
            </Link>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 uppercase">
              SHOPPING <span className="text-primary italic">BAG</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              You have {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart.
            </p>
          </div>
          <button 
            className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors border border-red-500/20 px-4 py-2 rounded-xl bg-red-500/5"
            onClick={clearCart}
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-6">
            {items.map((item) => {
              const name = parseProductName(item.productNameEn || item.productName);
              const img = parseProductImage(item.bigImage || item.productImage);
              const rawCjPrice = Number(item.sellPrice);
              const price = isNaN(rawCjPrice) ? 0 : calculateFinalPrice(rawCjPrice, settings);
              const lineTotal = price * item.quantity;

              return (
                <div 
                  key={`${item.pid}-${item.selectedVid || 'no-vid'}`} 
                  className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 transition-all hover:bg-white/10 hover:border-white/20 overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="relative w-full md:w-32 h-40 md:h-32 shrink-0 bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                    <Image
                      src={img}
                      alt={name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      unoptimized
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{item.categoryName}</span>
                        <span className="text-white/10 text-xs">•</span>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">In Stock</span>
                      </div>
                      <Link href={`/product/${item.pid}`} className="block mb-2">
                        <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">{name}</h3>
                      </Link>
                      {item.selectedVariantName && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/40 uppercase">
                          <Package size={10} className="text-primary" /> {item.selectedVariantName}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Unit Price</span>
                        <span className="text-lg font-black text-white">{formatUSD(price)}</span>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-black/50 border border-white/10 rounded-2xl p-1.5 h-12">
                        <button
                          className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                          onClick={() => updateQuantity(item.pid, item.quantity - 1, item.selectedVid)}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center text-sm font-black text-white">{item.quantity}</span>
                        <button
                          className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                          onClick={() => updateQuantity(item.pid, item.quantity + 1, item.selectedVid)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Line Total */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Total Price</span>
                      <span className="text-2xl font-black text-primary">{formatUSD(lineTotal)}</span>
                    </div>
                    <button
                      className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all group-hover:scale-110"
                      onClick={() => removeFromCart(item.pid, item.selectedVid)}
                      title="Remove Item"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-32 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl">
              <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                <ShoppingBag size={24} className="text-primary" /> Order Summary
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40 font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="text-white font-black">{formatUSD(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <span className="text-white/40 font-bold uppercase tracking-widest">Shipping</span>
                    <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">To Indonesia</span>
                  </div>
                  <span className="text-white font-black">
                    {isFetchingShipping ? (
                      <Loader2 size={16} className="animate-spin text-primary" />
                    ) : shippingEstimate === 0 ? (
                      <span className="text-green-500 font-black">FREE 🎉</span>
                    ) : (
                      formatUSD(shippingEstimate)
                    )}
                  </span>
                </div>

                {subtotal < settings.freeShippingThreshold && subtotal > 0 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Truck size={16} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed">
                          Add <span className="text-primary">{formatUSD(settings.freeShippingThreshold - subtotal)}</span> more for FREE SHIPPING!
                        </p>
                        <div className="w-full bg-black/40 h-1.5 rounded-full mt-2.5 overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (subtotal / settings.freeShippingThreshold) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-8 mb-10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-lg font-black text-white uppercase tracking-tight">Estimated Total</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">{formatUSD(grandTotal)}</span>
                </div>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Including VAT & Duties</p>
              </div>

              <Link 
                href="/checkout" 
                className="group relative w-full flex items-center justify-center gap-3 bg-white text-black px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all hover:bg-primary active:scale-95 shadow-2xl shadow-white/5 overflow-hidden mb-8"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent-light opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Proceed to Checkout</span>
                <ChevronRight size={20} className="relative z-10 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Trust Signals */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                {[
                  { icon: ShieldCheck, label: 'Secure SSL Checkout', color: 'text-green-500' },
                  { icon: Truck, label: 'Reliable Global Shipping', color: 'text-primary' },
                  { icon: RotateCcw, label: '30-Day Money Back', color: 'text-blue-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon size={16} className={item.color} />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

