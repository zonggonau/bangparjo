'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { calculateFinalPrice } from '@/lib/pricing';
import { useSettings } from '@/context/SettingsContext';
import styles from './HeroSection.module.css';

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
    bg: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
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
    bg: 'linear-gradient(135deg, #6B46C1 0%, #553C9A 50%, #E94560 100%)',
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
    bg: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0369A1 100%)',
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
      // Shuffle and pick 2
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
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[active];

  // Pick 2 products for left and right from our random pool
  const leftProd = displayProds[0];
  const rightProd = displayProds[1] || displayProds[0];

  const renderFloatCard = (prod: any, side: 'left' | 'right') => {
    if (!prod) return null;
    let img = prod.bigImage || prod.productImage || '';
    if (img.startsWith('[')) { try { img = JSON.parse(img)[0]; } catch { img = ''; } }
    
    return (
      <Link 
        href={`/product/${prod.pid}`}
        className={`${styles.floatCard} ${side === 'left' ? styles.cardLeft : styles.cardRight}`}
        style={{
          '--rotate': side === 'left' ? '-6deg' : '6deg',
          '--scale': '1.1',
          textDecoration: 'none'
        } as React.CSSProperties}
      >
        <div className={styles.floatCardInner}>
          <div className={styles.imgWrapper}>
            <Image
              src={img}
              alt={prod.productNameEn || 'Product'}
              width={160}
              height={160}
              className={styles.floatImg}
              unoptimized
              priority
            />
          </div>
          <div className={styles.floatInfo}>
            <span className={styles.floatName}>{(prod.productNameEn || prod.productName || '').substring(0, 24)}...</span>
            <span className={styles.floatPrice} style={{ color: slide.accent }}>
              ${calculateFinalPrice(prod.sellPrice, settings).toFixed(2)}
            </span>
          </div>
          <span className={styles.floatDiscount} style={{ background: slide.accent }}>SALE</span>
        </div>
      </Link>
    );
  };

  return (
    <div className={styles.hero} style={{ background: slide.bg }}>
      <div className={styles.bgCircle1} style={{ borderColor: slide.accent }} />
      <div className={styles.bgCircle2} style={{ borderColor: slide.accent }} />

      {/* 1 Left Card */}
      <div className={styles.productColLeft}>
        {renderFloatCard(leftProd, 'left')}
      </div>

      {/* Center content */}
      <div className={`${styles.heroContent} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
        <span className={styles.badge} style={{ background: slide.accent }}>
          {slide.badge}
        </span>

        <h1 className={styles.title}>
          {slide.title}<br />
          <span className={styles.highlight} style={{ color: slide.accent }}>
            {slide.highlight}
          </span>
        </h1>

        <p className={styles.subtitle}>{slide.subtitle}</p>

        <div className={styles.stats}>
          {[
            { value: '50K+', label: 'Products' },
            { value: '10K+', label: 'Customers' },
            { value: '4.8★', label: 'Rating' },
          ].map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <span className={styles.statValue} style={{ color: slide.accent }}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <Link href={slide.ctaLink} className={styles.ctaPrimary} style={{ background: slide.accent }}>
            {slide.cta} →
          </Link>
          <Link href={slide.secondaryLink} className={styles.ctaSecondary}>
            {slide.secondaryCta}
          </Link>
        </div>
      </div>

      {/* 1 Right Card */}
      <div className={styles.productColRight}>
        {renderFloatCard(rightProd, 'right')}
      </div>

      <div className={styles.indicators}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
            style={i === active ? { background: slide.accent } : {}}
            onClick={() => setActive(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className={styles.scrollIndicator}>
        <span>Scroll</span>
        <div className={styles.scrollArrow} />
      </div>
    </div>
  );
}
