import { cjFetch } from '@/lib/cj-api';
import DisputesClientView from './DisputesClientView';

export const dynamic = 'force-dynamic';

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt((resolvedSearchParams.page as string) || '1', 10);
  
  let disputes = [];
  let total = 0;

  try {
    const res = await cjFetch<any>(`/v1/disputes/getDisputeList?pageNum=${page}&pageSize=20`);
    if (res.success && res.data) {
      if (res.data.list) {
        disputes = res.data.list;
        total = res.data.total || 0;
      } else if (Array.isArray(res.data)) {
        disputes = res.data;
        total = res.data.length;
      }
    }
  } catch (error) {
    console.error('Failed to fetch disputes from CJ:', error);
  }

  return <DisputesClientView disputes={disputes} total={total} currentPage={page} />;
}
