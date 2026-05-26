import { cjFetch } from '@/lib/cj-api';
import { parseProductImage } from '@/lib/utils';
import ImporterClientView from './ImporterClientView';

export const dynamic = 'force-dynamic';

export default async function ProductImporterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = (resolvedSearchParams.q as string) || '';
  let results: any[] = [];

  if (query) {
    let finalQuery = query.trim();
    const urlMatch = finalQuery.match(/-p-(\d+)\.html/);
    const extractedPid = urlMatch ? urlMatch[1] : null;

    try {
      if (extractedPid || /^\d{15,}$/.test(finalQuery)) {
        const pid = extractedPid || finalQuery;
        const res = await cjFetch<any>(`/v1/product/query?pid=${pid}`);
        if (res.success && res.data) {
          const p = res.data;
          results = [{
            pid: p.pid || p.id || pid,
            productNameEn: p.productNameEn || p.nameEn || 'No Title',
            productImage: parseProductImage(p.productImage || p.bigImage || p.productImageSet),
            productSku: p.productSku || p.sku || 'No SKU',
            sellPrice: p.sellPrice || p.variantSellPrice || 0,
            categoryName: p.categoryName || p.threeCategoryName || 'Product'
          }];
        }
      } else {
        const isSku = finalQuery.toUpperCase().startsWith('CJ') || /^[a-zA-Z0-9-]{8,}$/.test(finalQuery);
        const param = isSku ? 'productSku' : 'productNameEn';
        const res = await cjFetch<any>(`/v1/product/list?${param}=${encodeURIComponent(finalQuery)}&pageSize=20`);
        if (res.success && res.data) {
          results = (res.data.list || []).map((p: any) => ({
            pid: p.pid || p.id,
            productNameEn: p.productNameEn || p.nameEn,
            productImage: parseProductImage(p.productImage || p.bigImage),
            productSku: p.productSku || p.sku,
            sellPrice: p.sellPrice,
            categoryName: p.categoryName || 'Product'
          }));
        }
      }
    } catch (e) {
      console.error('CJ Import Search Error:', e);
    }
  }

  return <ImporterClientView initialResults={results} initialQuery={query} />;
}
