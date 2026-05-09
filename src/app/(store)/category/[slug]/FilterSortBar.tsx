'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';
import styles from './category.module.css';

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
    
    params.set('page', '1'); // reset to page 1 on filter
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
    <div className={styles.filterBar}>
      <form onSubmit={handleFilter} className={styles.filterForm}>
        <div className={styles.filterGroup}>
          <label>Price Range:</label>
          <input 
            type="number" 
            placeholder="Min $" 
            value={minPrice} 
            onChange={(e) => setMinPrice(e.target.value)}
            className={styles.filterInput}
          />
          <span>-</span>
          <input 
            type="number" 
            placeholder="Max $" 
            value={maxPrice} 
            onChange={(e) => setMaxPrice(e.target.value)}
            className={styles.filterInput}
          />
          <button type="submit" className={styles.filterBtn}>Apply</button>
        </div>
      </form>

      <div className={styles.sortGroup}>
        <label>Sort By:</label>
        <select value={currentSort} onChange={handleSort} className={styles.sortSelect}>
          <option value="">Default</option>
          <option value="asc">Price: Low to High (Asc)</option>
          <option value="desc">Price: High to Low (Desc)</option>
        </select>
      </div>
    </div>
  );
}
