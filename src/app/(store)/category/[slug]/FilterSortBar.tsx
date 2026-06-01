'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';

const SORT_OPTIONS = [
  { value: '', label: 'Best Match' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'listed-desc', label: 'Most Listed' },
  { value: 'inventory-desc', label: 'Most Stock' },
];

export default function FilterSortBar({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentSort = searchParams.get('sort') || '';
  const currentMin = searchParams.get('minPrice') || '';
  const currentMax = searchParams.get('maxPrice') || '';
  const currentFreeShipping = searchParams.get('freeShipping') || '';
  const currentKeyword = searchParams.get('keyword') || '';

  const [minPrice, setMinPrice] = useState(currentMin);
  const [maxPrice, setMaxPrice] = useState(currentMax);
  const [freeShipping, setFreeShipping] = useState(currentFreeShipping === '1');
  const [keyword, setKeyword] = useState(currentKeyword);
  const [showFilters, setShowFilters] = useState(false);

  const buildParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    if (freeShipping) params.set('freeShipping', '1');
    else params.delete('freeShipping');
    if (keyword) params.set('keyword', keyword);
    else params.delete('keyword');
    params.set('page', '1');
    return params;
  };

  const handleFilter = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/category/${slug}?${buildParams().toString()}`);
  };

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('sort', val);
    else params.delete('sort');
    params.set('page', '1');
    router.push(`/category/${slug}?${params.toString()}`);
  };

  const clearAll = () => {
    setMinPrice('');
    setMaxPrice('');
    setFreeShipping(false);
    setKeyword('');
    router.push(`/category/${slug}`);
  };

  const hasActiveFilters = currentMin || currentMax || currentFreeShipping || currentKeyword;

  return (
    <div className="bg-white rounded-[16px] border border-gray-200 p-5 mb-8 shadow-sm">
      {/* Search + Sort Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Keyword search */}
        <form onSubmit={handleFilter} className="flex-1 min-w-[200px] flex gap-2">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search in category..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-gray-200 text-sm outline-none focus:border-[#FF6B00]"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-[10px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all border-none cursor-pointer">
            <i className="fas fa-search"></i>
          </button>
        </form>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <i className="fas fa-sort-amount-down text-[#FF6B00] text-xs hidden sm:block"></i>
          <select
            value={currentSort}
            onChange={handleSort}
            className="px-3 py-2.5 rounded-[10px] border border-gray-200 text-sm outline-none focus:border-[#FF6B00] cursor-pointer bg-white"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Toggle filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-bold border transition-all cursor-pointer ${
            hasActiveFilters
              ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#FF6B00]'
          }`}
        >
          <i className="fas fa-sliders-h"></i>
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="bg-white text-[#FF6B00] text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {[currentMin, currentMax, currentFreeShipping, currentKeyword].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button onClick={clearAll} className="text-sm text-gray-400 hover:text-red-500 underline bg-none border-none cursor-pointer">
            Clear all
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <form onSubmit={handleFilter} className="mt-5 pt-5 border-t border-gray-100">
          <div className="flex flex-wrap gap-6 items-end">
            {/* Price Range */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-gray-500 tracking-[0.05em] mb-2">Price Range ($)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-[90px] px-3 py-2 rounded-[8px] border border-gray-200 text-sm outline-none focus:border-[#FF6B00]"
                  min="0"
                  step="0.01"
                />
                <span className="text-gray-300 text-sm">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-[90px] px-3 py-2 rounded-[8px] border border-gray-200 text-sm outline-none focus:border-[#FF6B00]"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Free Shipping */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-gray-500 tracking-[0.05em] mb-2">Shipping</label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="w-[18px] h-[18px] accent-[#FF6B00]"
                />
                <span className="text-sm font-semibold text-gray-700">Free Shipping Only</span>
              </label>
            </div>

            {/* Apply Button */}
            <div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-[10px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all border-none cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
