import { prisma } from '@/lib/db';
import HeroSection from '@/components/HeroSection';

export default async function HomeHero() {
  // 1. Gunakan raw query untuk bypass validasi Prisma Client yang terkunci (Temporary Fix)
  // Ini memungkinkan fitur jalan meskipun prisma generate belum selesai dijalankan
  let dbHeroes: any[] = [];
  try {
    dbHeroes = await prisma.$queryRaw`
      SELECT p.* FROM "Product" p 
      WHERE p."isHero" = true AND p."status" = 'ACTIVE' 
      ORDER BY p."updatedAt" DESC 
      LIMIT 10
    `;

    // Ambil varian secara terpisah jika produk ditemukan
    if (dbHeroes.length > 0) {
      const pIds = dbHeroes.map(p => p.id);
      const allVariants = await prisma.variant.findMany({
        where: { productId: { in: pIds } }
      });
      
      // Gabungkan varian ke produk
      dbHeroes = dbHeroes.map(p => ({
        ...p,
        variants: allVariants.filter(v => v.productId === p.id)
      }));
    }
  } catch (err) {
    console.error('[Hero Raw Query Error]:', err);
    dbHeroes = [];
  }

  // 2. Map ke format yang diharapkan HeroSection (Format CJ)
  const heroProducts = dbHeroes.map(p => ({
    pid: p.cjId,
    productNameEn: p.name,
    productImage: p.images?.[0] || '/placeholder.png',
    sellPrice: p.variants?.[0]?.baseCost || 0,
  }));

  // 3. Jika belum ada produk Hero yang ditandai, gunakan fallback dari CJ
  if (heroProducts.length === 0) {
    const { getProducts } = await import('@/lib/cj-api');
    const heroRes = await getProducts({ pageSize: 10, keyWord: 'trending', searchType: 2 });
    const fallback = heroRes?.success && heroRes.data ? heroRes.data.list : [];
    return <HeroSection products={fallback} />;
  }

  return <HeroSection products={heroProducts} />;
}
