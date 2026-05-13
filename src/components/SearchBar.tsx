'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

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
    <form 
      className="relative w-full max-w-xl group" 
      onSubmit={handleSearch}
    >
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
        <Search size={18} className="text-white/20 group-focus-within:text-primary transition-colors" />
      </div>
      <input
        type="text"
        placeholder="Search products globally..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-32 py-4 text-sm text-white placeholder:text-white/10 focus:border-primary focus:bg-white/10 outline-none transition-all shadow-2xl"
      />
      <div className="absolute inset-y-1.5 right-1.5">
        <button 
          type="submit" 
          className="h-full bg-white text-black px-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all active:scale-95"
        >
          Search
        </button>
      </div>
    </form>
  );
}

