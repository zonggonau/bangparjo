'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface HeroProduct {
  pid: string;
  productNameEn?: string;
  productImage?: string;
  bigImage?: string;
  sellPrice?: number;
}

interface HeroSectionProps {
  products?: HeroProduct[];
}

export default function HeroSection({ products = [] }: HeroSectionProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 23, minutes: 59, seconds: 59 });

  // Auto rotate featured products
  const validProducts = products?.filter(p => p.productImage) || [];
  const slides = validProducts.length > 0 ? validProducts : [];

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Flash sale countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="relative bg-gradient-to-br from-[#FFF3E8] via-white to-[#FFF3E8] py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-120px] right-[-120px] w-[300px] h-[300px] rounded-full bg-[#FF6B00]/5 blur-[80px]"></div>
      <div className="absolute bottom-[-80px] left-[-80px] w-[250px] h-[250px] rounded-full bg-[#FF6B00]/5 blur-[60px]"></div>

      <div className="max-w-[1400px] mx-auto px-5 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[40px] lg:gap-[60px] items-center">
          {/* Left: Text Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-[rgba(255,107,0,0.15)] px-4 py-2 rounded-[50px] text-[12px] sm:text-[13px] font-semibold text-[#FF6B00] mb-4 sm:mb-6 shadow-sm animate-fadeIn">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
              </span>
              <span>🌐 Global E-Commerce Marketplace</span>
            </div>

            {/* Heading */}
            <h1 className="text-[30px] sm:text-[38px] lg:text-[48px] xl:text-[56px] font-extrabold leading-[1.1] mb-4 sm:mb-5 text-[#1A1A1A] tracking-[-1px]">
              Shop From Anywhere,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#E06000]">
                Delivered Everywhere
              </span>
            </h1>

            <p className="text-[15px] sm:text-[17px] text-[#555555] mb-6 sm:mb-8 leading-[1.7] max-w-[520px]">
              BangParjo connects you with <strong>quality products</strong> from around the world. 
              With <strong className="text-[#FF6B00]">worldwide shipping to 200+ countries</strong>, 
              your order is just a click away.
            </p>

            {/* CTAs */}
            <div className="flex gap-3 sm:gap-4 flex-wrap mb-6 sm:mb-8">
              <Link
                href="/#products"
                className="inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-3 sm:py-4 rounded-[10px] font-bold text-[14px] sm:text-[16px] transition-all duration-300 bg-[#FF6B00] text-white hover:bg-[#E06000] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,107,0,0.35)] active:translate-y-0"
              >
                Start Shopping
                <i className="fas fa-arrow-right text-sm"></i>
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-3 sm:py-4 rounded-[10px] font-bold text-[14px] sm:text-[16px] transition-all duration-300 border-2 border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white hover:-translate-y-0.5 active:translate-y-0"
              >
                <i className="fas fa-truck"></i>
                Track Order
              </Link>
            </div>

            {/* Flash Sale Countdown */}
            <div className="flex items-center gap-4 sm:gap-6 mb-6 p-4 sm:p-5 bg-white rounded-[14px] border border-[#FF6B00]/10 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-[22px]">⚡</span>
                <div>
                  <p className="text-[11px] font-extrabold text-[#EF4444] uppercase tracking-[1px] mb-0.5">Flash Sale</p>
                  <p className="text-[11px] text-[#888] font-semibold">Ends in</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Hrs', value: pad(countdown.hours) },
                  { label: 'Min', value: pad(countdown.minutes) },
                  { label: 'Sec', value: pad(countdown.seconds) },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="bg-[#1A1A1A] text-white font-black text-[18px] sm:text-[22px] w-[44px] sm:w-[50px] py-1.5 rounded-[8px] leading-none">
                      {item.value}
                    </div>
                    <p className="text-[9px] font-bold text-[#888] uppercase mt-1 tracking-[1px]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 sm:gap-10 pt-6 border-t border-[#E5E5E5]">
              {[
                { value: '200+', label: 'Countries' },
                { value: '10K+', label: 'Products' },
                { value: '50K+', label: 'Customers' },
              ].map((stat) => (
                <div key={stat.label}>
                  <h3 className="text-[22px] sm:text-[28px] font-black text-[#FF6B00]">{stat.value}</h3>
                  <p className="text-[12px] sm:text-[14px] text-[#888888] font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Showcase */}
          <div className="order-1 lg:order-2 flex justify-center items-center">
            <div className="relative w-full max-w-[500px]">
              {/* Main image container */}
              <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-br from-[#FFF3E8] to-white shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-[rgba(255,107,0,0.08)]">
                {/* Product slideshow */}
                {slides.length > 0 ? (
                  <div className="relative aspect-[4/3]">
                    {slides.map((product, idx) => (
                      <Link
                        key={product.pid}
                        href={`/product/${product.pid}`}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                          idx === activeSlide ? 'opacity-100 scale-100 z-10 pointer-events-auto' : 'opacity-0 scale-95 z-0 pointer-events-none'
                        }`}
                      >
                        <img
                          src={product.bigImage || product.productImage || '/placeholder.png'}
                          alt={product.productNameEn || 'Featured Product'}
                          className="w-full h-full object-cover"
                          loading={idx === 0 ? 'eager' : 'lazy'}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                          <p className="text-white text-sm font-semibold truncate">
                            {product.productNameEn || 'Featured Product'}
                          </p>
                          <p className="text-[#FF6B00] font-black text-lg">
                            ${product.sellPrice?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </Link>
                    ))}
                    
                    {/* Slide indicators */}
                    {slides.length > 1 && (
                      <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
                        {slides.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSlide(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              idx === activeSlide ? 'bg-[#FF6B00] w-6' : 'bg-white/60 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-[#FFF3E8] to-white flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80"
                      alt="Global E-Commerce"
                      loading="eager"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Floating badges */}
              <div className="absolute top-4 -right-2 sm:right-[-16px] bg-white/140 backdrop-blur-[20px] rounded-[12px] p-3 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-2.5 sm:gap-3 animate-[slideIn_0.6s_ease-out] z-20 border border-white/40">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FFF3E8]/80 flex items-center justify-center text-[20px] sm:text-[24px]">
                  ✈️
                </div>
                <div>
                  <strong className="text-[13px] sm:text-[15px] font-bold text-[#1A1A1A]">Worldwide</strong>
                  <p className="text-[11px] sm:text-[13px] text-[#22C55E] font-semibold">Fast Delivery</p>
                </div>
              </div>
              <div className="absolute -bottom-3 left-[10%] bg-white/80 backdrop-blur-md rounded-[50px] px-4 sm:px-5 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-[12px] sm:text-[14px] tracking-[2px] animate-[slideIn_0.8s_ease-out] z-20 border border-white/40">
                🇺🇸 🇬🇧 🇩🇪 🇫🇷 🇯🇵 🇦🇺 +194
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
