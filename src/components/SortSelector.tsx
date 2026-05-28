'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface SortSelectorProps {
  currentSort: number;
  className?: string;
}

export default function SortSelector({ currentSort, className }: SortSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'default') {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    // Reset to page 1 when sort changes
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const currentVal = searchParams.get('sort') || 'default';

  return (
    <select
      name="sort"
      id="sort"
      value={currentVal}
      className={className}
      onChange={(e) => handleSortChange(e.target.value)}
    >
      <option value="default">Best Match</option>
      <option value="newest">Newest Arrivals</option>
      <option value="oldest">Oldest</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="listed-desc">Most Popular (Listed)</option>
      <option value="inventory-desc">Highest Inventory</option>
    </select>
  );
}
