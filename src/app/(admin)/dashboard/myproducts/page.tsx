import { cjFetch } from '@/lib/cj-api';
import MyProductsClientView from './MyProductsClientView';

// Force dynamic since searchParams dictates data
export const dynamic = 'force-dynamic';

export default async function MyProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = parseInt((searchParams.page as string) || '1', 10);
  
  let products = [];
  let total = 0;

  try {
    const res = await cjFetch<any>(`/v1/product/myProduct/query?pageNum=${page}&pageSize=20`);
    if (res.success && res.data) {
      products = res.data.list || [];
      total = res.data.total || 0;
    }
  } catch (error) {
    console.error('Failed to fetch My Products from CJ:', error);
  }

  return <MyProductsClientView products={products} total={total} currentPage={page} />;
}
