import { getProducts } from '@/lib/cj';
import { prisma } from '@/lib/db';
import { getOrSet } from '@/lib/redis';
import ProductCard from '@/components/ProductCard';

const CACHE_TTL = 315360000; // 10 years (effectively forever)

async function getBestSellers() {
  return getOrSet('home:bestsellers', fetchBestSellers, CACHE_TTL);
}

async function fetchBestSellers() {
  const dbProducts = await prisma.product.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { variants: true }
  });

  let mainProducts = dbProducts.map(p => ({
    pid: p.cjId,
    productName: p.name,
    productNameEn: p.name,
    productImage: p.images[0],
    bigImage: p.images[0],
    sellPrice: p.variants[0]?.sellingPrice || 0,
    categoryName: "Imported",
    productSku: "",
    productWeight: 0,
    productUnit: "piece",
    categoryId: "",
  }));

  if (mainProducts.length < 1) {
    try {
      const mainRes = await getProducts({ pageSize: 8, productFlag: 0 }); 
      if (mainRes.success && mainRes.data) {
        const apiProducts = mainRes.data.list;
        const pids = new Set(mainProducts.map(p => p.pid));
        apiProducts.forEach((p: any) => {
          if (!pids.has(p.pid)) mainProducts.push(p);
        });
      }
    } catch (e) {
      console.warn('[HomeBestSellers] CJ API Fallback failed, showing empty or DB only.');
    }
  }

  return mainProducts;
}

export default async function HomeBestSellers() {
  const mainProducts = await getBestSellers();

  if (mainProducts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {mainProducts.map((product) => (
        <ProductCard key={product.pid} product={product as any} />
      ))}
    </div>
  );
}
