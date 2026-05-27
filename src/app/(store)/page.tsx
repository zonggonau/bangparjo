import { prisma } from '@/lib/db';
import { getOrSet } from '@/lib/redis';
import { Suspense } from 'react';
import HeroSection from '@/components/HeroSection';
import HomeCategories from '@/components/home-sections/HomeCategories';
import HomeBestSellers from '@/components/home-sections/HomeBestSellers';
import HomeBeauty from '@/components/home-sections/HomeBeauty';
import HomeFashion from '@/components/home-sections/HomeFashion';
import HomeElectronics from '@/components/home-sections/HomeElectronics';
import HomeToys from '@/components/home-sections/HomeToys';
import HomeHomeLiving from '@/components/home-sections/HomeHomeLiving';
import Newsletter from '@/components/Newsletter';
import LiveSales from '@/components/LiveSales';
import AIChat from '@/components/AIChat';
import { getDBStoreSettings, calculateFinalPrice } from '@/lib/pricing';


const CACHE_TTL = 3600; // 1 hour

async function getFeaturedProducts() {
  return getOrSet('home:featured', fetchFeaturedProducts, CACHE_TTL);
}

async function fetchFeaturedProducts() {
  let featuredProducts: any[] = [];
  try {
    const dbProducts = await prisma.product.findMany({
      where: { isHero: true, status: 'ACTIVE' },
      include: { variants: { take: 1 } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
    featuredProducts = dbProducts.map(p => ({
      pid: p.cjId,
      productNameEn: p.name,
      productImage: p.images?.[0] || '',
      bigImage: p.images?.[p.images.length > 1 ? 1 : 0] || p.images?.[0] || '',
      sellPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
    }));
  } catch (e) {
    console.warn('[HomePage] Failed to fetch featured products:', e);
  }

  // Fallback: if no pinned products, show latest active products
  if (featuredProducts.length === 0) {
    try {
      const fallbackProducts = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: { variants: { take: 1 } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      });
      featuredProducts = fallbackProducts.map(p => ({
        pid: p.cjId,
        productNameEn: p.name,
        productImage: p.images?.[0] || '',
        bigImage: p.images?.[p.images.length > 1 ? 1 : 0] || p.images?.[0] || '',
        sellPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
      }));
    } catch (e) {
      console.warn('[HomePage] Fallback fetch also failed:', e);
    }
  }

  return featuredProducts;
}

async function FeaturedHeroWrapper() {
  const rawFeaturedProducts = await getFeaturedProducts();

  // Fetch real-time settings
  const settings = await getDBStoreSettings();

  const featuredProducts = rawFeaturedProducts
    .map((p: any) => {
      const rawPrice = Number(p.sellPrice || 0);
      const targetPrice = calculateFinalPrice(rawPrice, settings);

      return {
        ...p,
        sellPrice: targetPrice,
      };
    });


  return <HeroSection products={featuredProducts} />;
}

export default function HomePage() {
  return (
    <div>
      {/* ===== HERO ===== */}
      <Suspense fallback={<div className="h-[400px] sm:h-[500px] lg:h-[600px] w-full bg-gray-200 animate-pulse flex items-center justify-center text-gray-500">Loading Featured Products...</div>}>
        <FeaturedHeroWrapper />
      </Suspense>

      {/* ===== GLOBAL SHIPPING BADGE ===== */}
      <div className="bg-gradient-to-r from-[#FF6B00] to-[#E06000] py-3 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-5">
          <div className="flex justify-center items-center gap-6 sm:gap-10 flex-wrap">
            <span className="text-white text-[13px] sm:text-[14px] flex items-center gap-1.5">
              🌍 <strong>Global E-Commerce</strong> — Shipping to <strong className="text-white/90">200+ Countries</strong>
            </span>
            <span className="text-white text-[13px] sm:text-[14px] flex items-center gap-1.5">
              ✈️ <strong className="text-white/90">7-14 Days</strong> Delivery Time
            </span>
            <span className="text-white text-[13px] sm:text-[14px] flex items-center gap-1.5">
              🔒 <strong className="text-white/90">Secure</strong> SSL-Encrypted Checkout
            </span>
          </div>
        </div>
      </div>

      {/* ===== CATEGORIES ===== */}
      <HomeCategories />

      {/* ===== BEST SELLERS ===== */}
      <section className="py-16 sm:py-20" id="products" style={{ background: '#F5F5F5' }}>
        <div className="max-w-[1400px] mx-auto px-5">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-flex items-center gap-2 bg-[#FF6B00]/10 text-[#FF6B00] text-[11px] sm:text-[12px] font-bold px-4 py-1.5 rounded-[50px] uppercase tracking-[1.5px] mb-4">
              <i className="fas fa-fire"></i> Top Picks
            </span>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[34px] font-extrabold text-[#1A1A1A] mb-3">
              Best Sellers
            </h2>
            <p className="text-[#888888] text-sm sm:text-base max-w-[500px] mx-auto">
              Our most popular products chosen by global shoppers
            </p>
          </div>
          <HomeBestSellers />
        </div>
      </section>

      {/* ===== BEAUTY SECTION ===== */}
      <HomeBeauty />

      {/* ===== FASHION SECTION ===== */}
      <HomeFashion />

      {/* ===== ELECTRONICS SECTION ===== */}
      <HomeElectronics />

      {/* ===== TOYS SECTION ===== */}
      <HomeToys />

      {/* ===== HOME & LIVING SECTION ===== */}
      <HomeHomeLiving />

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16 sm:py-20 bg-[#1A1A1A] text-white">
        <div className="max-w-[1400px] mx-auto px-5">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white text-[11px] sm:text-[12px] font-bold px-4 py-1.5 rounded-[50px] uppercase tracking-[1.5px] mb-4">
              <i className="fas fa-star text-[#FF6B00]"></i> Trusted Worldwide
            </span>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[34px] font-extrabold mb-3">
              What Our Customers Say
            </h2>
            <p className="text-white/60 text-sm sm:text-base max-w-[500px] mx-auto">
              Join 50,000+ happy customers worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah Johnson',
                location: 'New York, USA',
                text: 'Amazing quality products at unbeatable prices. The shipping was faster than expected!',
                rating: 5,
              },
              {
                name: 'Marcus Chen',
                location: 'Singapore',
                text: 'I run a small dropshipping business and BangParjo has been a game-changer for my supply chain.',
                rating: 5,
              },
              {
                name: 'Amara Okafor',
                location: 'Lagos, Nigeria',
                text: 'Finally a platform that truly delivers worldwide. Customer service is top-notch!',
                rating: 5,
              },
            ].map((t, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-sm rounded-[16px] p-6 sm:p-8 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <i key={j} className="fas fa-star text-[#FF6B00] text-sm"></i>
                  ))}
                </div>
                <p className="text-white/80 text-sm sm:text-base leading-[1.7] mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY BANGPARJO ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-5">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 bg-[#FF6B00]/10 text-[#FF6B00] text-[11px] sm:text-[12px] font-bold px-4 py-1.5 rounded-[50px] uppercase tracking-[1.5px] mb-4">
              <i className="fas fa-gem"></i> Why Us
            </span>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[34px] font-extrabold text-[#1A1A1A] mb-3">
              Why Choose BangParjo?
            </h2>
            <p className="text-[#888888] text-sm sm:text-base max-w-[500px] mx-auto">
              The best dropshipping platform for global entrepreneurs
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚚', title: 'Worldwide Shipping', desc: 'Fast international shipping to over 200 countries with real-time tracking.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'SSL encrypted transactions with multiple payment gateways.' },
              { icon: '🔄', title: 'Easy Returns', desc: '30-day money-back guarantee. Hassle-free return policy.' },
              { icon: '💬', title: '24/7 Support', desc: 'Dedicated support team ready to help you anytime, anywhere.' },
            ].map((f, i) => (
              <div
                key={i}
                className="text-center p-8 rounded-[16px] bg-[#FAFAFA] border border-[#E5E5E5] transition-all duration-300 hover:bg-[#FFF3E8] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(255,107,0,0.08)] hover:border-[#FF6B00]/20"
              >
                <span className="text-[44px] mb-5 block">{f.icon}</span>
                <h4 className="text-lg font-bold text-[#1A1A1A] mb-3">{f.title}</h4>
                <p className="text-[14px] text-[#888888] leading-[1.7]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <Newsletter />

      {/* ===== FLOATING COMPONENTS ===== */}
      <LiveSales />
      <AIChat />
    </div>
  );
}
