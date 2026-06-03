import { prisma } from '@/lib/db';
import { getFullCategoryTreeAction } from '@/lib/actions-catalog';
import ProductsClientView from './ProductsClientView';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  // 1. Get already imported cjIds to prevent double importing
  const importedProducts = await prisma.product.findMany({
    select: { cjId: true }
  });
  const importedCjIds = importedProducts.map(p => p.cjId);

  // 2. Get full category tree untuk filter & import
  const catRes = await getFullCategoryTreeAction();
  const categoryTree = catRes.success ? catRes.data || [] : [];

  return (
    <ProductsClientView 
      importedCjIds={importedCjIds} 
      categoryTree={categoryTree} 
    />
  );
}
