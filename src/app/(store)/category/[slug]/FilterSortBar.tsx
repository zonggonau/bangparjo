'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';

export default function FilterSortBar({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentSort = searchParams.get('sort') || '';
  const currentMin = searchParams.get('minPrice') || '';
  const currentMax = searchParams.get('maxPrice') || '';

  const [minPrice, setMinPrice] = useState(currentMin);
  const [maxPrice, setMaxPrice] = useState(currentMax);

  const handleFilter = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    
    params.set('page', '1');
    router.push(`/category/${slug}?${params.toString()}`);
  };

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (val) params.set('sort', val);
    else params.delete('sort');
    
    router.push(`/category/${slug}?${params.toString()}`);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-4 md:p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl">
      <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <div className="flex items-center gap-2 text-white/50">
          <Filter size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Price Range</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="number" 
            placeholder="Min" 
            value={minPrice} 
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full sm:w-24 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-primary/50 outline-none transition-all placeholder:text-white/20"
          />
          <span className="text-white/20">-</span>
          <input 
            type="number" 
            placeholder="Max" 
            value={maxPrice} 
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full sm:w-24 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-primary/50 outline-none transition-all placeholder:text-white/20"
          />
          <button 
            type="submit" 
            className="px-6 py-2 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-colors active:scale-95 shadow-lg shadow-white/5"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
        <div className="flex items-center gap-2 text-white/50">
          <ArrowUpDown size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Sort By</span>
        </div>
        <select 
          value={currentSort} 
          onChange={handleSort} 
          className="flex-1 md:flex-none bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary/50 outline-none transition-all appearance-none cursor-pointer pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff44%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
        >
          <option value="">Default Order</option>
          <option value="asc">Price: Low to High</option>
          <option value="desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}

