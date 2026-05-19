'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="flex items-center bg-[#F5F5F5] rounded-[50px] px-4 flex-1 max-w-[500px] border-2 border-transparent transition-all duration-300 focus-within:border-[#FF6B00] focus-within:bg-white"
    >
      <input
        type="text"
        placeholder="Search products globally..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 py-2.5 px-3 bg-transparent text-sm text-[#1A1A1A] placeholder:text-[#888888] outline-none border-none"
      />
      <button type="submit" className="bg-none cursor-pointer text-[#888888] text-lg p-2 transition-all duration-300 hover:text-[#FF6B00] border-none">
        <i className="fas fa-search"></i>
      </button>
    </form>
  );
}
