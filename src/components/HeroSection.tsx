'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { calculateFinalPrice } from '@/lib/pricing';
import { useSettings } from '@/context/SettingsContext';
import { ChevronRight, Star, ShoppingBag, ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    badge: '🏠 Home Essentials',
    title: 'Modern &',
    highlight: 'KITCHENWARE',
    subtitle: 'Upgrade your home with our curated collection of kitchen tools and home essentials. Quality guaranteed.',
    cta: 'Shop Collection',
    ctaLink: '/category/home-kitchen',
    secondaryCta: 'View All',
    secondaryLink: '/category/all',
    bg: 'from-secondary via-secondary-light to-accent',
    accent: '#FF6B35',
  },
  {
    id: 2,
    badge: '✨ Trending Now',
    title: 'Smart Home',
    highlight: 'SOLUTIONS',
    subtitle: 'Discover the latest innovations for a more comfortable and efficient living space.',
    cta: 'Explore More',
    ctaLink: '/category/home-kitchen',
    secondaryCta: "Bestsellers",
    secondaryLink: '/?q=trending',
    bg: 'from-[#1A1A2E] via-[#2D3436] to-[#E94560]',
    accent: '#F6E05E',
  },
  {
    id: 3,
    badge: '🍲 Cook like a Pro',
    title: 'Premium',
    highlight: 'COOKWARE',
    subtitle: 'Professional grade tools for your everyday culinary adventures. Sourced from top makers.',
    cta: 'Shop Now',
    ctaLink: '/category/home-kitchen',
    secondaryCta: 'Cooking Deals',
    secondaryLink: '/?q=kitchen deals',
    bg: 'from-[#0F172A] via-[#1E293B] to-[#0369A1]',
    accent: '#38BDF8',
  },
];

interface HeroSectionProps {
  products?: any[];
}

export default function HeroSection({ products = [] }: HeroSectionProps) {
  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayProds, setDisplayProds] = useState<any[]>([]);
  const { settings } = useSettings();

  useEffect(() => {
    if (products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setDisplayProds(shuffled.slice(0, 2));
    }
  }, [products]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActive((prev) => (prev + 1) % SLIDES.length);
        setIsAnimating(false);
      }, 500);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[active];
  const leftProd = displayProds[0];
  const rightProd = displayProds[1] || displayProds[0];

  const renderFloatCard = (prod: any, side: 'left' | 'right') => {
    if (!prod) return null;
    let img = prod.bigImage || prod.productImage || '';
    if (img.startsWith('[')) { try { img = JSON.parse(img)[0]; } catch { img = ''; } }
    
    return (
      <Link 
        href={`/product/${prod.pid}`}
        className={`hidden xl:block absolute top-1/2 -translate-y-1/2 group z-20 transition-all duration-700 ease-out ${
          side === 'left' ? 'left-8 md:left-24 rotate-[-6deg]' : 'right-8 md:right-24 rotate-[6deg]'
        } ${isAnimating ? 'opacity-0 scale-90 translate-y-[-40%]' : 'opacity-100 scale-100 translate-y-[-50%]'}`}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-0">
          <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden mb-4 bg-white/5">
            <Image
              src={img}
              alt={prod.productNameEn || 'Product'}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              unoptimized
              priority
            />
          </div>
          <div className="space-y-1">
            <span className="block text-xs font-medium text-gray-400 truncate w-32 md:w-44">
              {(prod.productNameEn || prod.productName || '').substring(0, 40)}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold" style={{ color: slide.accent }}>
                ${calculateFinalPrice(prod.sellPrice, settings).toFixed(2)}
              </span>
              <div className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white">SALE</div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className={`relative min-h-[90vh] md:min-h-screen overflow-hidden flex items-center justify-center pt-24 pb-12 transition-colors duration-1000 bg-gradient-to-br ${slide.bg}`}>
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full border-[60px] blur-3xl animate-pulse" style={{ borderColor: slide.accent }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full border-[80px] blur-3xl animate-pulse" style={{ borderColor: slide.accent, animationDelay: '1s' }} />
      </div>

      {/* Floating Cards */}
      {renderFloatCard(leftProd, 'left')}
      {renderFloatCard(rightProd, 'right')}

      {/* Center content */}
      <div className={`relative z-10 container text-center transition-all duration-700 ease-out max-w-4xl ${
        isAnimating ? 'opacity-0 blur-sm translate-y-4' : 'opacity-100 blur-0 translate-y-0'
      }`}>
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 animate-bounce shadow-lg shadow-black/20"
          style={{ backgroundColor: slide.accent, color: '#000' }}
        >
          {slide.badge}
        </div>

        <h1 className="font-outfit text-5xl md:text-8xl font-black text-white leading-[0.9] mb-6 tracking-tight">
          {slide.title}<br />
          <span className="bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent italic" style={{ color: slide.accent }}>
            {slide.highlight}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          {slide.subtitle}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12">
          {[
            { value: '50K+', label: 'Premium Products' },
            { value: '10K+', label: 'Happy Customers' },
            { value: '4.9★', label: 'Verified Rating' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-bold text-white flex items-center gap-1">
                {stat.value} {i === 2 && <Star size={20} className="fill-current text-yellow-400" />}
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href={slide.ctaLink} 
            className="group flex items-center gap-2 px-10 py-5 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-black/20"
            style={{ backgroundColor: slide.accent, color: '#000' }}
          >
            {slide.cta} <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link 
            href={slide.secondaryLink} 
            className="px-10 py-5 rounded-2xl text-lg font-bold text-white border border-white/20 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
          >
            {slide.secondaryCta}
          </Link>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`transition-all duration-500 rounded-full ${
              i === active ? 'w-10 h-2' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
            }`}
            style={i === active ? { backgroundColor: slide.accent } : {}}
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] animate-pulse">
        <span>Scroll Down</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </div>
  );
}

