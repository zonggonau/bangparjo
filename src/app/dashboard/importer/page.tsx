'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProductImporter() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [isHeroSelected, setIsHeroSelected] = useState<Record<string, boolean>>({});

  const parseImg = (img: any): string => {
    if (!img) return '/placeholder.png';
    if (typeof img === 'string') {
      const trimmed = img.trim();
      // Handle JSON array string like ["https://..."]
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) return parseImg(parsed[0]);
        } catch (e) { /* fallback to direct string */ }
      }
      if (trimmed.startsWith('//')) return `https:${trimmed}`;
      return trimmed;
    }
    if (Array.isArray(img) && img.length > 0) return parseImg(img[0]);
    return '/placeholder.png';
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    setResults([]);
    
    try {
      let finalQuery = query.trim();
      
      // 1. Detect if it's a CJ URL and extract PID
      const urlMatch = finalQuery.match(/-p-(\d+)\.html/);
      const extractedPid = urlMatch ? urlMatch[1] : null;
      
      // 2. Determine search strategy
      if (extractedPid || /^\d{15,}$/.test(finalQuery)) {
        const pid = extractedPid || finalQuery;
        const res = await fetch(`/api/cj-proxy?endpoint=/v1/product/query?pid=${pid}`);
        const data = await res.json();
        if (data.success && data.data) {
          const p = data.data;
          // Robust normalization for single product detail
          setResults([{
            pid: p.pid || p.id || pid,
            productNameEn: p.productNameEn || p.nameEn || 'No Title',
            productImage: parseImg(p.productImage || p.bigImage || p.productImageSet),
            productSku: p.productSku || p.sku || 'No SKU',
            sellPrice: p.sellPrice || p.variantSellPrice || 0,
            categoryName: p.categoryName || p.threeCategoryName || 'Product'
          }]);
          return;
        }
      }

      // 3. Fallback to list search
      const isSku = finalQuery.toUpperCase().startsWith('CJ') || /^[a-zA-Z0-9-]{8,}$/.test(finalQuery);
      const param = isSku ? 'productSku' : 'productNameEn';
      
      const res = await fetch(`/api/cj-proxy?endpoint=/v1/product/list?${param}=${encodeURIComponent(finalQuery)}&pageSize=20`);
      const data = await res.json();
      
      if (data.success && data.data) {
        // Map list results with fallbacks too
        const list = (data.data.list || []).map((p: any) => ({
          pid: p.pid || p.id,
          productNameEn: p.productNameEn || p.nameEn,
          productImage: parseImg(p.productImage || p.bigImage),
          productSku: p.productSku || p.sku,
          sellPrice: p.sellPrice,
          categoryName: p.categoryName || 'Product'
        }));
        setResults(list);
        
        if (isSku && list.length === 0) {
          const fallbackRes = await fetch(`/api/cj-proxy?endpoint=/v1/product/list?productNameEn=${encodeURIComponent(finalQuery)}&pageSize=20`);
          const fallbackData = await fallbackRes.json();
          if (fallbackData.success && fallbackData.data) {
            setResults((fallbackData.data.list || []).map((p: any) => ({
              pid: p.pid || p.id,
              productNameEn: p.productNameEn || p.nameEn,
              productImage: parseImg(p.productImage || p.bigImage),
              productSku: p.productSku || p.sku,
              sellPrice: p.sellPrice,
              categoryName: p.categoryName || 'Product'
            })));
          }
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (pid: string) => {
    setImporting(pid);
    try {
      const res = await fetch('/api/admin/import-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, isHero: !!isHeroSelected[pid] })
      });
      const data = await res.json();
      if (data.success) {
        alert('Product Imported Successfully!');
      } else {
        alert('Import Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Product Importer</h1>
        <p style={{ color: '#71717a', marginTop: '0.25rem', fontSize: '0.9rem' }}>Search and import products directly from CJ Dropshipping to your store.</p>
      </header>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          placeholder="Search products on CJ (e.g. 'watch', 'shoes')..."
          style={{ 
            flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e4e4e7',
            fontSize: '0.9rem', outline: 'none'
          }}
        />
        <button 
          disabled={searching}
          type="submit"
          style={{ 
            padding: '0.75rem 1.5rem', background: '#18181b', color: 'white', 
            border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          {searching ? 'Searching...' : 'Search CJ'}
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {results.map((p) => (
          <div key={p.pid} style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
              <Image 
                src={p.productImage ? (p.productImage.startsWith('//') ? `https:${p.productImage}` : p.productImage) : '/placeholder.png'} 
                alt={p.productNameEn || 'Product Image'} 
                fill 
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }} 
              />
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', background: '#f4f4f5', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>ID: {p.pid}</span>
                {p.productSku && <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>SKU: {p.productSku}</span>}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 600, marginBottom: '0.25rem' }}>{p.categoryName}</div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.5rem 0', height: '2.4rem', overflow: 'hidden', lineBreak: 'anywhere' }} title={p.productNameEn}>
                {p.productNameEn}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>${p.sellPrice}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', color: '#18181b', fontWeight: 500 }}>
                  <input 
                    type="checkbox" 
                    checked={!!isHeroSelected[p.pid]} 
                    onChange={(e) => setIsHeroSelected(prev => ({ ...prev, [p.pid]: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  Hero?
                </label>
              </div>
              <button 
                onClick={() => handleImport(p.pid)}
                disabled={importing === p.pid}
                style={{ 
                  width: '100%',
                  padding: '0.6rem 1rem', background: '#18181b', color: 'white', 
                  border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
              >
                {importing === p.pid ? 'Importing...' : 'Import to Store'}
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && !searching && query && (
          <div style={{ gridColumn: '1/-1', padding: '5rem', textAlign: 'center', color: '#71717a' }}>
            No products found for "{query}". Try a different keyword.
          </div>
        )}
      </div>
    </div>
  );
}
