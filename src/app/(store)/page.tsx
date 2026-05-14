import HomeHero from '@/components/home-sections/HomeHero';
import HomeBestSellers from '@/components/home-sections/HomeBestSellers';
import HomeFashion from '@/components/home-sections/HomeFashion';
import HomeElectronics from '@/components/home-sections/HomeElectronics';
import HomeBeauty from '@/components/home-sections/HomeBeauty';
import FeaturedSection from '@/components/FeaturedSection';
import PromoBanner from '@/components/PromoBanner';
import TrustBadges from '@/components/TrustBadges';
import Newsletter from '@/components/Newsletter';
import MoodSearch from '@/components/MoodSearch';
import LiveSales from '@/components/LiveSales';

export default function HomePage() {
  return (
    <div className="bg-[#07070e] min-h-screen">
      {/* 1. Hero Section (Dynamic from DB/CJ) */}
      <HomeHero />

      {/* 2. Mood-based AI Search & Trust */}
      <div className="container px-4 -mt-20 relative z-10 space-y-12">
        <MoodSearch />
        <TrustBadges />
      </div>

      {/* 3. Trending Best Sellers */}
      <HomeBestSellers />

      {/* 4. Promotional Banner */}
      <div className="container px-4 py-20">
        <PromoBanner />
      </div>

      {/* 5. Category-specific Sections */}
      <div className="space-y-0">
        <HomeFashion />
        <HomeElectronics />
        <HomeBeauty />
      </div>

      {/* 6. Why Choose Us / Brand Story */}
      <FeaturedSection />

      {/* 7. Newsletter Subscription */}
      <Newsletter />

      {/* 8. Floating Purchase Notifications */}
      <LiveSales />
    </div>
  );
}
