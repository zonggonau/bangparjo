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
    params.set('sort', value);
    // Reset to page 1 when sort changes
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <select
      name="sort"
      id="sort"
      defaultValue={currentSort}
      className={className}
      onChange={(e) => handleSortChange(e.target.value)}
    >
      <option value="0">Default (All)</option>
      <option value="2">Hot & Trending</option>
      <option value="3">New Arrivals</option>
    </select>
  );
}
