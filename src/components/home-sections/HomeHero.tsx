import HeroSection from '@/components/HeroSection';
import { prisma } from '@/lib/db';

export default async function HomeHero() {
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

  const heroProducts = dbHeroes.map(p => ({
    pid: p.cjId,
    productNameEn: p.name,
    productImage: p.images?.[0] || '/placeholder.png',
    sellPrice: p.variants?.[0]?.baseCost || 0,
  }));

  return <HeroSection products={heroProducts} />;
}
