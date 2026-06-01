import { getCategoriesAction } from '@/lib/actions-admin-categories';
import CategoriesClientView from './CategoriesClientView';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const res = await getCategoriesAction();
  const categories = res.success ? res.data || [] : [];

  return <CategoriesClientView categories={categories} />;
}
