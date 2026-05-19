'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';

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
    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleFilter} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-filter" style={{ color: 'var(--primary)' }}></i>
            <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Range</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="number" 
              placeholder="Min" 
              value={minPrice} 
              onChange={(e) => setMinPrice(e.target.value)}
              style={{ width: '100px', padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}
            />
            <span style={{ color: 'var(--gray-300)' }}>-</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ width: '100px', padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}
            />
            <button 
              type="submit" 
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Apply
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-sort-amount-down" style={{ color: 'var(--primary)' }}></i>
            <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort By</span>
          </div>
          <select 
            value={currentSort} 
            onChange={handleSort} 
            style={{ padding: '8px 32px 8px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: '14px', background: 'var(--white)', cursor: 'pointer' }}
          >
            <option value="">Default Order</option>
            <option value="asc">Price: Low to High</option>
            <option value="desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}

