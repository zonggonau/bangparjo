'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  CheckCircle2, 
  Package, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  X, 
  ChevronRight, 
  Star, 
  Zap, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  ArrowLeft,
  Loader2,
  Clock,
  Flame,
  Minus,
  Plus,
  Lock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { getProductDetails, getShippingFee, CJShippingMethod, parseProductName, parseProductImage } from '@/lib/cj-api';
import { calculateFinalPrice, calculateShippingFee, getStoreSettings } from '@/lib/pricing';
import { calculateMarkupPrice } from '@/lib/ai-content';
import PayPalButton from '@/components/PayPalButton';
import MidtransPayment from '@/components/MidtransPayment';
import { countries as COUNTRIES } from '@/lib/countries';

function fmtUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

type Props = { params: Promise<{ slug: string }> };

export default function BuyPage({ params }: Props) {
  const { slug } = use(params);

  // slug = "<pid>--<seo-title>" OR just "<pid>"
  const pid = slug.split('--')[0];

  const [product, setProduct] = useState<any>(null);
  const [aiContent, setAiContent] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', city: '', province: '', zip: '', country: 'US' });
  const [countryTouched, setCountryTouched] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<CJShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<CJShippingMethod | null>(null);
  const [fetchingShipping, setFetchingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [grandTotal, setGrandTotal] = useState(0);
  const [countdown, setCountdown] = useState({ h: 0, m: 23, s: 47 });

  // Countdown timer for urgency
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 23, m: 59, s: 59 }; // Reset
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Load product
  useEffect(() => {
    setLoading(true);
    getProductDetails(pid).then(res => {
      if (res.success && res.data) {
        setProduct(res.data);
        if (res.data.variants?.length > 0) setSelectedVariant(res.data.variants[0]);
      }
    }).finally(() => setLoading(false));

    // Load AI-generated content in background (non-blocking)
    fetch(`/api/ai/generate-content?pid=${pid}&mode=full`)
      .then(r => r.json())
      .then(d => { if (d.success) setAiContent(d.data); })
      .catch(() => {});
  }, [pid]);

  // Fetch shipping when country changes
  useEffect(() => {
    if (!product || !countryTouched || !selectedVariant?.vid) return;
    const timer = setTimeout(() => {
      setFetchingShipping(true);
      setShippingError('');
      setShippingMethods([]);
      setSelectedShipping(null);
      getShippingFee({ products: [{ vid: selectedVariant.vid, quantity: qty }], endCountryCode: formData.country })
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setShippingMethods(res.data);
            setSelectedShipping(res.data[0]);
          } else {
            setShippingError('Shipping not available to this country. Try another destination.');
          }
        })
        .catch(() => setShippingError('Failed to fetch shipping rates.'))
        .finally(() => setFetchingShipping(false));
    }, 600);
    return () => clearTimeout(timer);
  }, [product, formData.country, selectedVariant, qty, countryTouched]);

  // Recalculate grand total
  useEffect(() => {
    if (!product) return;
    const settings = getStoreSettings();
    const baseCj = parseFloat(selectedVariant?.variantSellPrice || product.sellPrice || 0);
    const selling = aiContent?.sellingPrice || calculateFinalPrice(baseCj, settings);
    const shipping = selectedShipping ? calculateShippingFee(selectedShipping.logisticPrice || 0, selling * qty, settings) : 0;
    setGrandTotal(selling * qty + shipping);
  }, [product, selectedVariant, qty, selectedShipping, aiContent]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!countryTouched || !selectedShipping) {
      setSubmitError(!countryTouched ? 'Please select your country to calculate shipping.' : 'Please wait for shipping methods to load.');
      return;
    }
    setSubmitting(true);
    try {
      const orderNum = `BUY-${Date.now()}`;
      const dbRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNum,
          customerEmail: formData.email,
          customerName: formData.name,
          customerPhone: formData.phone,
          totalAmount: grandTotal,
          costAmount: parseFloat(selectedVariant?.variantSellPrice || product.sellPrice || 0),
          status: 'UNPAID',
          orderData: JSON.stringify({
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
            logisticName: selectedShipping.logisticName,
            fromCountryCode: 'CN',
            payType: 2,
            products: [{ vid: selectedVariant?.vid, sku: selectedVariant?.variantSku, quantity: qty }],
          }),
        }),
      });
      const json = await dbRes.json();
      if (json.success) {
        setOrderId(orderNum);
      } else {
        throw new Error(json.error || 'Failed to place order');
      }
    } catch (err: any) {
      setSubmitError('❌ ' + (err.message || 'An error occurred. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070e] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Acquiring premium asset...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#07070e] flex flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/20">
          <Search size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Product Not Found</h1>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">This exclusive item may have been moved or reached its final shipment.</p>
        </div>
        <Link href="/" className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95">
          ← Browse Collection
        </Link>
      </div>
    );
  }

  const images = product.productImageSet?.length > 0 ? product.productImageSet : [product.productImage || product.bigImage];
  const baseCj = parseFloat(selectedVariant?.variantSellPrice || product.sellPrice || 0);
  const pricing = calculateMarkupPrice(baseCj);
  const sellingPrice = aiContent?.sellingPrice || pricing.sellingPrice;
  const originalPrice = aiContent?.originalPrice || pricing.originalPrice;
  const discount = aiContent?.discount || pricing.discount;
  const title = aiContent?.title || parseProductName(product.productNameEn || product.productName);
  const description = aiContent?.captions?.instagram || product.description || '';

  if (orderId) {
    return (
      <div className="min-h-screen bg-[#07070e] flex items-start justify-center p-6 md:pt-20">
        <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 text-center backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-8 shadow-lg shadow-primary/10">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Order Placed!</h1>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-6">Reference: #{orderId}</p>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed font-medium">Complete your payment below to confirm your order. We&apos;ll start processing immediately after confirmation.</p>

          <div className="bg-white/5 rounded-2xl p-6 mb-10 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Amount</span>
            <span className="text-2xl font-black text-primary italic">{fmtUSD(grandTotal)}</span>
          </div>

          {isPaid ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-green-500 text-sm font-bold flex items-center justify-center gap-3">
              <CheckCircle2 size={20} />
              <span>Payment Confirmed! Tracking will be emailed soon.</span>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.country === 'ID' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                    🇮🇩 Local Gateway (QRIS, VA, Card)
                  </div>
                  <MidtransPayment orderId={orderId} amount={grandTotal} customerDetails={{ name: formData.name, email: formData.email, phone: formData.phone }} onSuccess={() => setIsPaid(true)} />
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center gap-2 justify-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                  🌎 Global Gateway (PayPal, Card)
                </div>
                <PayPalButton amount={grandTotal} orderId={orderId} onSuccess={() => setIsPaid(true)} />
              </div>
            </div>
          )}

          <Link href="/" className="inline-block mt-10 text-xs font-black text-white/20 uppercase tracking-[0.2em] hover:text-white transition-colors">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070e] text-[#f0f0f6] pb-32 selection:bg-primary selection:text-white">
      {/* ── Urgency Bar ── */}
      <div className="bg-gradient-to-r from-primary via-accent-light to-primary bg-[length:200%_100%] animate-[shimmerBg_4s_linear_infinite] py-3 px-4 flex flex-wrap items-center justify-center gap-6 md:gap-12 sticky top-0 z-[100] shadow-xl">
        <div className="flex items-center gap-3">
          <Flame size={14} className="text-white fill-white animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">FLASH SALE ENDING IN:</span>
          <span className="font-mono text-sm font-black text-white bg-black/20 px-2 py-0.5 rounded-md">
            {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-white" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">GLOBAL FREE SHIPPING AVAILABLE</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-12 pt-12 md:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
          
          {/* ── LEFT: Product visuals ── */}
          <div className="lg:col-span-6 space-y-8 lg:sticky lg:top-32 h-fit">
            <div className="relative aspect-square bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden group shadow-2xl">
              <div className="absolute top-8 left-8 z-10">
                <span className="bg-primary text-black font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-full shadow-lg shadow-primary/20">
                  {discount}
                </span>
              </div>
              <Image
                src={parseProductImage(images[selectedImage] || images[0])}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-8 group-hover:scale-105 transition-transform duration-700"
                unoptimized
                priority
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex flex-wrap gap-4">
                {images.slice(0, 6).map((img: string, i: number) => (
                  <button 
                    key={i} 
                    className={`relative w-20 h-20 bg-white/5 border rounded-2xl overflow-hidden transition-all duration-300 ${
                      selectedImage === i ? 'border-primary ring-2 ring-primary/20' : 'border-white/5 opacity-40 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <Image src={parseProductImage(img)} alt={`View ${i + 1}`} fill sizes="80px" unoptimized className="object-contain p-2" />
                  </button>
                ))}
              </div>
            )}

            {/* Social Proof */}
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-primary fill-primary" />)}
                </div>
                <span className="text-xs font-black text-white/50 uppercase tracking-widest">4.8/5 (2,400+ Verified Buyers)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5 group-hover:border-primary/20 transition-colors">
                     <Lock size={14} />
                   </div>
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover:text-white transition-colors">Secure Checkout</span>
                </div>
                <div className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5 group-hover:border-primary/20 transition-colors">
                     <RotateCcw size={14} />
                   </div>
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover:text-white transition-colors">30-Day Returns</span>
                </div>
                <div className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5 group-hover:border-primary/20 transition-colors">
                     <ShieldCheck size={14} />
                   </div>
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover:text-white transition-colors">Verified Item</span>
                </div>
                <div className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5 group-hover:border-primary/20 transition-colors">
                     <Truck size={14} />
                   </div>
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover:text-white transition-colors">Tracked Shipping</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Info + Form ── */}
          <div className="lg:col-span-6 space-y-12">
            {/* Header Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                  {product.categoryName || aiContent?.categories?.[0] || 'Exclusive Deal'}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                  <Globe size={12} /> Global Fulfillment
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-[1.1]">
                {title}
              </h1>

              {aiContent?.viralScore && (
                <div className="bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary px-6 py-4 rounded-r-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={16} className="text-primary fill-primary" />
                    <span className="text-xs font-black text-primary uppercase tracking-widest italic">Viral Score: {aiContent.viralScore}/10</span>
                  </div>
                  <p className="text-xs font-medium text-gray-400 italic">“{aiContent.viralReason}”</p>
                </div>
              )}

              <div className="flex items-baseline gap-6">
                <span className="text-5xl font-black text-white italic tracking-tighter text-glow">{fmtUSD(sellingPrice)}</span>
                <span className="text-xl font-bold text-white/20 line-through decoration-primary/30 decoration-2">{fmtUSD(originalPrice)}</span>
                <div className="bg-accent-light/10 text-accent-light px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                  Save {discount}
                </div>
              </div>

              {/* Variants */}
              {product.variants?.length > 1 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Select Style / Color</p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((v: any) => (
                      <button
                        key={v.vid}
                        className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 border ${
                          selectedVariant?.vid === v.vid 
                            ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-105' 
                            : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                        onClick={() => setSelectedVariant(v)}
                      >
                        {v.variantNameEn || v.variantKey || 'Option'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Quantity</p>
                <div className="flex items-center w-fit bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                  <button className="w-12 h-12 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={16} /></button>
                  <span className="w-12 text-center text-sm font-black text-white italic">{qty}</span>
                  <button className="w-12 h-12 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setQty(q => q + 1)}><Plus size={16} /></button>
                </div>
              </div>

              {/* Stock urgency */}
              <div className="space-y-3">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-primary to-accent-light w-[68%] rounded-full animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-primary fill-primary" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                    Limited Stock: <span className="text-primary">Only 32 units left</span> at this price point
                  </p>
                </div>
              </div>
            </div>

            {/* ── ORDER FORM ── */}
            <form 
              className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 space-y-10 shadow-2xl backdrop-blur-xl relative overflow-hidden" 
              onSubmit={handlePlaceOrder} 
              id="order-form"
            >
              {/* Background Glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />

              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                  <MapPin size={24} className="text-primary" /> Shipping Info
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Full Name</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/5 outline-none focus:border-primary transition-all" type="text" placeholder="John Smith" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Email Address</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/5 outline-none focus:border-primary transition-all" type="email" placeholder="john@example.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mb-6">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Phone Number</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/5 outline-none focus:border-primary transition-all" type="tel" placeholder="+1 234 567 890" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Street Address</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/5 outline-none focus:border-primary transition-all" type="text" placeholder="123 Luxury Lane, Apt 4" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">City</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/5 outline-none focus:border-primary transition-all" type="text" placeholder="Los Angeles" required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Province / State</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/5 outline-none focus:border-primary transition-all" type="text" placeholder="California" value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">ZIP Code</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/5 outline-none focus:border-primary transition-all" type="text" placeholder="90001" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2 mb-10">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Target Country</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                    <select
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-sm text-white outline-none focus:border-primary transition-all appearance-none"
                      value={formData.country}
                      onChange={e => { setFormData({ ...formData, country: e.target.value }); setCountryTouched(true); }}
                      required
                    >
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Shipping methods */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Truck size={18} className="text-primary" /> Logistics Partner
                </h3>
                {fetchingShipping ? (
                  <div className="flex items-center gap-3 py-6 text-xs font-bold text-white/20 uppercase tracking-widest">
                    <Loader2 size={16} className="animate-spin text-primary" /> Calculating optimal routes...
                  </div>
                ) : shippingMethods.length > 0 ? (
                  <div className="space-y-3">
                    {shippingMethods.map(m => {
                      const settings = getStoreSettings();
                      const fee = calculateShippingFee(m.logisticPrice || 0, sellingPrice * qty, settings);
                      const active = selectedShipping?.logisticName === m.logisticName;
                      return (
                        <label key={m.logisticName} className={`flex items-center gap-4 bg-black/40 border rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
                          active ? 'border-primary ring-1 ring-primary/20' : 'border-white/5 hover:border-white/20'
                        }`}>
                          <input type="radio" name="shipping" className="accent-primary" checked={active} onChange={() => setSelectedShipping(m)} />
                          <div className="flex-1">
                            <span className="block text-sm font-bold text-white mb-0.5">{m.logisticName}</span>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                              <Clock size={12} /> {m.logisticAging} Days Delivery
                            </span>
                          </div>
                          <span className={`text-sm font-black italic ${fee === 0 ? 'text-green-400' : 'text-primary'}`}>
                            {fee === 0 ? 'FREE' : fmtUSD(fee)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : shippingError ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-500 text-xs font-bold flex items-center gap-3">
                    <X size={16} /> {shippingError}
                  </div>
                ) : (
                  <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Select country to unlock shipping options</p>
                  </div>
                )}
              </div>

              {/* Order summary */}
              <div className="bg-white/5 rounded-3xl p-8 space-y-4">
                <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-widest">
                  <span>Subtotal ({qty} Items)</span>
                  <span>{fmtUSD(sellingPrice * qty)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-widest">
                  <span>Shipping & Handling</span>
                  <span className={selectedShipping && grandTotal - sellingPrice * qty === 0 ? 'text-green-400' : ''}>
                    {selectedShipping ? (grandTotal - sellingPrice * qty === 0 ? 'FREE' : fmtUSD(grandTotal - sellingPrice * qty)) : '—'}
                  </span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                   <span className="text-lg font-black text-white uppercase italic tracking-tighter">Grand Total</span>
                   <span className="text-3xl font-black text-primary italic text-glow">{fmtUSD(grandTotal)}</span>
                </div>
              </div>

              {submitError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-red-500 text-xs font-bold text-center animate-in slide-in-from-top-2">
                  {submitError}
                </div>
              )}

              <div className="space-y-4">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-white text-black hover:bg-primary transition-all duration-300 py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-white/5 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 group"
                >
                  {submitting ? <Loader2 size={24} className="animate-spin" /> : (
                    <>
                      ⚡ {aiContent?.cta || 'Secure Checkout Now'}
                      <ChevronRight size={20} className="transition-transform group-hover:translate-x-2" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                  <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> SSL Secure</span>
                  <span className="flex items-center gap-1.5"><Lock size={12} /> Encrypted</span>
                  <span className="flex items-center gap-1.5"><Star size={12} className="fill-white/20" /> Satisfaction</span>
                </div>
              </div>
            </form>

            {/* ── Tabs / Additional Info ── */}
            <div className="space-y-12">
               {/* Product Story */}
               <section className="space-y-6">
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Product Intelligence</span>
                   <div className="h-px flex-1 bg-white/5" />
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">The Breakdown</h2>
                 <div className="text-gray-400 text-sm leading-loose font-medium space-y-4">
                    {description ? <p className="whitespace-pre-line">{description}</p> : <p>High-end craftsmanship meets global innovation. This curated product is sourced from verified worldwide manufacturers to ensure the best balance of quality and competitive pricing. Rigorously tested for performance and aesthetics.</p>}
                    
                    {aiContent?.videoScript && (
                      <div className="mt-8 p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Flame size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Creator Video Insight</span>
                        </div>
                        <pre className="text-xs text-white/30 whitespace-pre-wrap italic font-sans leading-relaxed">{aiContent.videoScript}</pre>
                      </div>
                    )}
                 </div>
               </section>

               {/* Guarantees */}
               <section className="space-y-6">
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Global Logistics</span>
                   <div className="h-px flex-1 bg-white/5" />
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Delivery & Protection</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl group hover:border-primary/20 transition-colors">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5 group-hover:bg-primary/10 transition-all"><Package size={20} /></div>
                       <div>
                         <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Processing Time</h4>
                         <p className="text-xs text-gray-500 font-medium">1–3 Business Days</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl group hover:border-primary/20 transition-colors">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5 group-hover:bg-primary/10 transition-all"><Globe size={20} /></div>
                       <div>
                         <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Transit Time</h4>
                         <p className="text-xs text-gray-500 font-medium">7–15 Business Days Globally</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl group hover:border-primary/20 transition-colors">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5 group-hover:bg-primary/10 transition-all"><RotateCcw size={20} /></div>
                       <div>
                         <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Return Policy</h4>
                         <p className="text-xs text-gray-500 font-medium">30-Day Performance Guarantee</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl group hover:border-primary/20 transition-colors">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5 group-hover:bg-primary/10 transition-all"><ShieldCheck size={20} /></div>
                       <div>
                         <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Authenticity</h4>
                         <p className="text-xs text-gray-500 font-medium">100% Verified Sourcing</p>
                       </div>
                    </div>
                 </div>
               </section>
            </div>
          </div>
        </div>
      </div>

      {/* Floating CTA for mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden animate-in slide-in-from-bottom duration-500">
         <div className="bg-[#07070e]/80 backdrop-blur-2xl border-t border-white/10 px-6 py-4 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Final Price</span>
              <span className="text-xl font-black text-primary italic leading-none">{fmtUSD(sellingPrice)}</span>
            </div>
            <button 
              className="flex-1 bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/10 active:scale-95 transition-all"
              onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              ⚡ Order Now
            </button>
         </div>
      </div>
    </div>
  );
}
) => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}>
          ⚡ Buy Now
        </button>
      </div>
    </div>
  );
}
