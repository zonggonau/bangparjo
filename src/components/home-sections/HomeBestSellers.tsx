import { getProducts } from '@/lib/cj-api';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';

export default async function HomeBestSellers() {
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

  if (mainProducts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {mainProducts.map((product) => (
        <ProductCard key={product.pid} product={product as any} />
      ))}
    </div>
  );
}
