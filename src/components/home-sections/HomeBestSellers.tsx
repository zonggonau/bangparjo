import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';

async function getBestSellers() {
  try {
    const dbProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { variants: { take: 1 } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return dbProducts.map((p: any) => ({
      pid: p.cjId,
      productName: p.name,
      productNameEn: p.name,
      productImage: p.images?.[0] || '',
      bigImage: p.images?.[0] || '',
      sellPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
      nowPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
      discountPrice: '',
      categoryName: 'Best Sellers',
      productSku: p.variants?.[0]?.sku || '',
      productWeight: p.variants?.[0]?.weight || 0,
      productUnit: 'piece',
      categoryId: p.categoryId,
      listedNum: 0,
      isFreeShipping: false,
    }));
  } catch (e) {
    console.warn('[HomeBestSellers] DB fetch failed:', e);
  }

  return [];
}

export default async function HomeBestSellers() {
  const mainProducts = await getBestSellers();

  if (mainProducts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {mainProducts.map((product: any) => (
        <ProductCard key={product.pid} product={product as any} />
      ))}
    </div>
  );
}
