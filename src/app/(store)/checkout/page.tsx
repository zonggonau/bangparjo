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
import { 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle2, 
  Copy, 
  AlertCircle, 
  Loader2,
  Globe,
  Phone,
  Mail,
  User,
  MapPin,
  ChevronRight,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';

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

  const isCartCheckout = !pidParam && cartItems.length > 0;

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
  }, [pidParam, vidParam, cartItems.length]);

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
          ? 'Please select your destination country to calculate shipping first.'
          : 'Please wait for shipping methods to load and select one.'
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
      setSubmitError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || ((pidParam || cartItems.length > 0) && !product && !orderId)) return (
    <div className="min-h-screen pt-32 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Preparing Checkout...</p>
      </div>
    </div>
  );

  if (!pidParam && cartItems.length === 0 && !orderId) return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center text-center">
      <div className="container max-w-2xl px-6">
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/20 mx-auto mb-8 shadow-2xl">
          <ShoppingCart size={40} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">Your cart is empty</h1>
        <p className="text-gray-400 mb-10 text-sm leading-relaxed max-w-md mx-auto font-medium">
          Looks like you haven&apos;t added anything to checkout yet. Explore our curated collection and find something extraordinary.
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

  const productImage = product ? parseProductImage(product.bigImage || product.productImage) : '';
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
  const grandTotal = subtotal + finalShippingCost + taxAmount;

  if (orderId) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container max-w-4xl px-4 md:px-8">
          <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-2xl">
            <div className="p-8 md:p-12 text-center bg-primary/10 border-b border-white/5">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-black mx-auto mb-6 shadow-lg shadow-primary/20">
                <CheckCircle2 size={40} />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase italic">
                {isPaid ? 'PAYMENT RECEIVED' : 'ORDER PLACED'}
              </h1>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white/50 uppercase tracking-widest">
                <Package size={14} className="text-primary" /> Order #{orderId}
              </div>
            </div>

            <div className="p-8 md:p-12">
              {isPaid ? (
                <div className="text-center space-y-6">
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Thank you for your purchase!</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
                    We&apos;ve received your payment and our team is currently processing your order. You will receive an email update with tracking information once your package ships.
                  </p>
                  <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                    <Link href="/" className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-xl">
                      Back to Home
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <ShoppingBag size={18} className="text-primary" /> Order Details
                    </h3>
                    <div className="space-y-4 mb-8">
                      {finalItems.map((item, idx) => (
                        <div key={`${item.pid}-${idx}`} className="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl group transition-all hover:bg-white/10">
                          <div className="relative w-16 h-16 shrink-0 bg-white/5 rounded-xl overflow-hidden border border-white/5">
                            <Image src={item.img} alt={item.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className="text-xs font-bold text-white line-clamp-1 uppercase mb-1">{item.name}</p>
                            {item.variant && <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Variant: {item.variant}</p>}
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                              Qty: {item.qty} · {formatUSD(item.price * item.qty)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Total Amount</span>
                        <span className="text-2xl font-black text-primary tracking-tighter">{formatUSD(finalAmount)}</span>
                      </div>
                      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Including shipping & taxes</p>
                    </div>
                  </div>

                  <div className="flex flex-col h-full">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <CreditCard size={18} className="text-primary" /> Payment Method
                    </h3>
                    <p className="text-gray-400 text-xs mb-8 leading-relaxed">Choose your preferred payment method below to complete the order. Secure encryption is applied to all transactions.</p>
                    
                    <div className="space-y-6 flex-1">
                      {formData.country === 'ID' && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Local Payment (Indonesia)</span>
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

                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Global Payment</span>
                        <PayPalButton 
                          amount={finalAmount} 
                          orderId={orderId!} 
                          onSuccess={() => setIsPaid(true)} 
                        />
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-center gap-3">
                      <ShieldCheck size={20} className="text-green-500 shrink-0" />
                      <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest">100% Encrypted & Secure checkout processed by world-class providers.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 md:px-12 md:py-8 bg-white/5 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
                <ArrowLeft size={14} /> Return to Shopping
              </Link>
              {!isPaid && (
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                  <Clock size={14} /> Awaiting payment
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Link 
              href="/cart" 
              className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft size={14} /> Back to Bag
            </Link>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 uppercase italic">
              SECURE <span className="text-primary">CHECKOUT</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium">Complete your order details below.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-10">
            {/* Shipping Information */}
            <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                <MapPin size={20} className="text-primary" /> Shipping Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <User size={10} /> Full Name
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter your full name"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/10" 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Mail size={10} /> Email Address
                  </label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@example.com"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/10" 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Phone size={10} /> Phone Number
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+1 234 567 890"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/10" 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Globe size={10} /> Destination Country
                  </label>
                  <select 
                    required
                    value={formData.country} 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff44%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat"
                    onChange={e => { setFormData({ ...formData, country: e.target.value }); setCountryTouched(true); }} 
                  >
                    {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-[#07070e]">{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <MapPin size={10} /> Street Address
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="Street name, building, apartment"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/10" 
                  onChange={e => setFormData({ ...formData, address: e.target.value })} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">City</label>
                  <input type="text" required placeholder="City" className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/10" onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Province</label>
                  <input type="text" placeholder="State" className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/10" onChange={e => setFormData({ ...formData, province: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">ZIP Code</label>
                  <input type="text" placeholder="Postcode" className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/10" onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                </div>
              </div>
            </section>

            {/* Shipping Method */}
            <section id="shipping-section" className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                <Truck size={20} className="text-primary" /> Shipping Method
              </h3>
              
              {fetchingShipping ? (
                <div className="p-12 text-center flex flex-col items-center gap-4 bg-black/30 rounded-[2rem] border border-white/5">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Calculating shipping rates...</span>
                </div>
              ) : shippingMethods.length > 0 ? (
                <div className="space-y-4">
                  {shippingMethods.map((method) => (
                    <label 
                      key={method.logisticName} 
                      className={`relative flex items-center justify-between p-6 bg-white/5 border rounded-[2rem] cursor-pointer transition-all hover:bg-white/10 ${
                        selectedShipping?.logisticName === method.logisticName 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                          : 'border-white/5'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="shipping" 
                        className="sr-only"
                        checked={selectedShipping?.logisticName === method.logisticName} 
                        onChange={() => setSelectedShipping(method)} 
                      />
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          selectedShipping?.logisticName === method.logisticName ? 'bg-primary text-black' : 'bg-white/5 text-white/30'
                        }`}>
                          <Truck size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{method.logisticName}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            <Clock size={10} /> {method.logisticAging}{method.logisticAging && !method.logisticAging.includes('days') ? ' days' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-white">
                          { calculateShippingFee(method.logisticPrice, cartSubtotal, settings) === 0
                            ? <span className="text-green-500">FREE</span> 
                            : formatUSD(calculateShippingFee(method.logisticPrice, cartSubtotal, settings)) }
                        </span>
                      </div>
                      {selectedShipping?.logisticName === method.logisticName && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              ) : shippingError ? (
                <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex items-center gap-4">
                  <AlertCircle className="text-red-500 shrink-0" size={24} />
                  <p className="text-xs font-bold text-red-500/80 leading-relaxed tracking-tight">{shippingError}</p>
                </div>
              ) : (
                <div className="p-12 text-center bg-black/30 rounded-[2rem] border border-white/5 border-dashed">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Select a country above to see shipping methods.</p>
                </div>
              )}
            </section>

            {submitError && (
              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4 animate-shake">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <p className="text-xs font-bold text-red-500/80">{submitError}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="group relative w-full flex items-center justify-center gap-4 bg-white text-black px-10 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-primary active:scale-95 shadow-2xl shadow-white/5 overflow-hidden disabled:opacity-50 disabled:grayscale"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent-light opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? (
                <Loader2 size={24} className="animate-spin relative z-10" />
              ) : (
                <>
                  <span className="relative z-10">Place Order {selectedShipping ? `· ${formatUSD(grandTotal)}` : ''}</span>
                  <ChevronRight size={24} className="relative z-10 transition-transform group-hover:translate-x-2" />
                </>
              )}
            </button>
          </form>

          {/* Order Summary */}
          <aside className="lg:col-span-5">
            <div className="sticky top-32 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                <ShoppingBag size={20} className="text-primary" /> Order Summary
              </h3>

              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-6 mb-8 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                {isCartCheckout ? (
                  cartItems.map(item => (
                    <div key={`${item.pid}-${item.selectedVid || 'no-vid'}`} className="flex gap-4 group">
                      <div className="relative w-16 h-16 shrink-0 bg-white/5 rounded-xl overflow-hidden border border-white/5 transition-transform group-hover:scale-105">
                        <Image src={parseProductImage(item.bigImage || item.productImage)} alt={parseProductName(item.productNameEn || item.productName)} fill sizes="64px" className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-xs font-bold text-white line-clamp-1 uppercase mb-1 tracking-tight">{parseProductName(item.productNameEn || item.productName)}</p>
                        {item.selectedVariantName && <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mb-1">Variant: {item.selectedVariantName}</p>}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Qty: {item.quantity}</span>
                          <span className="text-sm font-black text-white">{formatUSD(calculateFinalPrice(Number(item.sellPrice), settings) * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : product ? (
                  <div className="flex gap-6 group">
                    <div className="relative w-24 h-24 shrink-0 bg-white/5 rounded-2xl overflow-hidden border border-white/5 transition-transform group-hover:scale-105">
                      <Image src={productImage} alt={parseProductName(product.productNameEn || product.productName)} fill sizes="96px" className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-black text-white line-clamp-2 uppercase mb-2 tracking-tight leading-tight">{parseProductName(product.productNameEn || product.productName)}</p>
                      {selectedVariant && <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">Variant: {selectedVariant.variantNameEn || selectedVariant.variantKey}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Qty: {qty}</span>
                        <span className="text-lg font-black text-white">{formatUSD(variantPrice * qty)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-white/10 pt-8 space-y-4 mb-8">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="text-white font-black">{formatUSD(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-bold uppercase tracking-widest">Shipping</span>
                  <span className="text-white font-black">
                    {selectedShipping ? (finalShippingCost === 0 ? <span className="text-green-500">FREE</span> : formatUSD(finalShippingCost)) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-bold uppercase tracking-widest">Estimated Tax ({settings.taxPct || 0}%)</span>
                  <span className="text-white font-black">{formatUSD(taxAmount)}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-8 mb-10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-lg font-black text-white uppercase tracking-tight italic">GRAND TOTAL</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">{formatUSD(grandTotal)}</span>
                </div>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Prices include VAT and standard duties</p>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                {[
                  { icon: ShieldCheck, label: 'Secured by AES-256 Encryption', color: 'text-green-500' },
                  { icon: Globe, label: 'International Delivery Tracking', color: 'text-primary' },
                  { icon: RotateCcw, label: 'Hassle-Free 30-Day Returns', color: 'text-blue-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon size={16} className={item.color} />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">{item.label}</span>
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
ading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
