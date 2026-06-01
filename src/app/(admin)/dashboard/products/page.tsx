import { prisma } from '@/lib/db';
import { getCategoryMenuAction } from '@/lib/actions-catalog';
import ProductsClientView from './ProductsClientView';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  // 1. Get already imported cjIds to prevent double importing
  const importedProducts = await prisma.product.findMany({
    select: { cjId: true }
  });
  const importedCjIds = importedProducts.map(p => p.cjId);

  // 2. Get category tree for hierarchical Mega Menu filter
  const catRes = await getCategoryMenuAction();
  const categoryTree = catRes.success ? catRes.data || [] : [];

  return (
    <ProductsClientView 
      importedCjIds={importedCjIds} 
      categoryTree={categoryTree} 
    />
  );
}
