'use client';

import { useRouter } from 'next/navigation';

interface SearchFiltersProps {
  query: string;
  categoryFilter: string;
  minPrice: number | null;
  maxPrice: number | null;
  categories: { id: string; name: string; slug: string }[];
}

export default function SearchFilters({ query, categoryFilter, minPrice, maxPrice, categories }: SearchFiltersProps) {
  const router = useRouter();

  const buildFilterUrl = (params: Record<string, string>) => {
    const url = new URLSearchParams();
    if (query) url.set('q', query);
    Object.entries(params).forEach(([k, v]) => { if (v) url.set(k, v); });
    return `/search?${url.toString()}`;
  };

  const navigate = (params: Record<string, string>) => {
    router.push(buildFilterUrl(params));
  };

  return (
    <div className="flex gap-3 mb-8 flex-wrap items-center">
      {/* Category Filter */}
      <select
        defaultValue={categoryFilter}
        onChange={(e) => navigate({ category: e.target.value, page: '1' })}
        className="px-4 py-2.5 rounded-md border-2 border-gray-200 text-sm bg-white cursor-pointer min-w-[160px] outline-none"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>{cat.name}</option>
        ))}
      </select>

      {/* Min Price */}
      <input
        type="number"
        placeholder="Min $"
        defaultValue={minPrice ?? ''}
        onBlur={(e) => {
          if (e.target.value) {
            navigate({ minPrice: e.target.value, page: '1' });
          }
        }}
        className="px-4 py-2.5 rounded-md border-2 border-gray-200 text-sm w-[100px] min-w-[80px] outline-none flex-1"
      />

      {/* Max Price */}
      <input
        type="number"
        placeholder="Max $"
        defaultValue={maxPrice ?? ''}
        onBlur={(e) => {
          if (e.target.value) {
            navigate({ maxPrice: e.target.value, page: '1' });
          }
        }}
        className="px-4 py-2.5 rounded-md border-2 border-gray-200 text-sm w-[100px] min-w-[80px] outline-none flex-1"
      />

      {/* Clear Filters */}
      {(categoryFilter || minPrice !== null || maxPrice !== null) && (
        <a
          href={`/search?q=${encodeURIComponent(query)}`}
          className="px-4 py-2.5 rounded-md text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all duration-200 no-underline"
        >
          <i className="fas fa-times"></i> Clear Filters
        </a>
      )}
    </div>
  );
}
