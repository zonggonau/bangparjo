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
    badge: '🔥 Trending Now',
    title: 'Viral Finds',
    highlight: 'YOU\'LL LOVE',
    subtitle: 'Discover what the BangParjo community is obsessing over right now. Curated picks, real hype, zero fluff.',
    cta: 'Shop Trending',
    ctaLink: '/?q=trending',
    secondaryCta: 'Community Picks',
    secondaryLink: '/?q=popular',
    bg: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
    accent: '#FF6B35',
  },
  {
    id: 2,
    badge: '👥 Community Faves',
    title: 'Shop What',
    highlight: 'EVERYONE LOVES',
    subtitle: 'From must-have gadgets to style steals — see what your community is adding to cart.',
    cta: 'Explore Faves',
    ctaLink: '/?q=trending',
    secondaryCta: "New Arrivals",
    secondaryLink: '/?q=new',
    bg: 'linear-gradient(135deg, #6B46C1 0%, #553C9A 50%, #E94560 100%)',
    accent: '#F6E05E',
  },
  {
    id: 3,
    badge: '✨ Curated for You',
    title: 'Your Vibe,',
    highlight: 'YOUR STYLE',
    subtitle: 'Personalized picks that match your taste. Because you deserve better than the algorithm.',
    cta: 'Shop Now',
    ctaLink: '/?q=trending',
    secondaryCta: 'Share with Friends',
    secondaryLink: '/?q=viral',
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
          <span className={styles.floatDiscount} style={{ background: slide.accent }}>HOT 🔥</span>
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
            { value: '50K+', label: 'Finds' },
            { value: '10K+', label: 'Community' },
            { value: '4.8★', label: 'Vibes' },
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
