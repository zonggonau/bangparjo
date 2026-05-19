import HeroSection from '@/components/HeroSection';
import { getAppCache, setAppCache } from '@/lib/cache';
import { prisma } from '@/lib/db';

export default async function HomeHero() {
  const cacheKey = 'home_hero_v1';
  let heroProducts = await getAppCache<any[]>(cacheKey);

  if (!heroProducts) {
    let dbHeroes: any[] = [];
    try {
      dbHeroes = await prisma.product.findMany({
        where: { isHero: true, status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: { variants: true }
      });
    } catch (err) {
      console.error('[Hero DB Error]:', err);
    }

    heroProducts = dbHeroes.map(p => ({
      pid: p.cjId,
      productNameEn: p.name,
      productImage: p.images?.[0] || '/placeholder.png',
      sellPrice: p.variants?.[0]?.baseCost || 0,
    }));

    if (heroProducts.length === 0) {
      const { getProducts } = await import('@/lib/cj-api');
      const heroRes = await getProducts({ pageSize: 10, keyWord: 'trending', searchType: 2 });
      heroProducts = heroRes?.success && heroRes.data ? heroRes.data.list : [];
    }
    
    if (heroProducts && heroProducts.length > 0) {
      await setAppCache(cacheKey, heroProducts, 3600);
    }
  }

  return <HeroSection products={heroProducts} />;
}
