'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SearchBar.module.css';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <form className={styles.searchBar} onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Search products globally..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.input}
      />
      <button type="submit" className={styles.button}>
        Search
      </button>
    </form>
  );
}
