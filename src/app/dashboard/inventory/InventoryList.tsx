'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Variant {
  id: string;
  cjId: string;
  sku: string;
  color: string | null;
  size: string | null;
  inventory: number;
  sellingPrice: number;
  baseCost: number;
}

interface Product {
  id: string;
  cjId: string;
  name: string;
  images: string[];
  variants: Variant[];
  isHero: boolean;
}

export default function InventoryList({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSync = async (e: React.MouseEvent, productId: string, cjId: string) => {
    e.stopPropagation();
    setLoading(`sync-${productId}`);
    try {
      const res = await fetch('/api/admin/inventory/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: cjId }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setProducts(products.map(p => p.id === productId ? { ...p, variants: data.variants } : p));
        alert('Sync successful!');
      } else {
        alert('Sync failed: ' + data.error);
      }
    } catch (err) {
      alert('Error syncing product');
    } finally {
      setLoading(null);
    }
  };

  const handleToggleHero = async (productId: string, currentStatus: boolean) => {
    setLoading(`hero-${productId}`);
    try {
      const res = await fetch('/api/admin/inventory/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, isHero: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map(p => p.id === productId ? { ...p, isHero: data.product.isHero } : p));
      } else {
        alert('Failed to update hero status');
      }
    } catch (err) {
      alert('Error updating hero status');
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    console.log('[DEBUG] InventoryList component mounted');
    const globalClickListener = (e: MouseEvent) => {
      console.log('[DEBUG] Global Click Target:', e.target);
    };
    window.addEventListener('click', globalClickListener);
    return () => window.removeEventListener('click', globalClickListener);
  }, []);

  const handleDelete = async (e: React.MouseEvent, productId: string) => {
    alert('System: DELETE FUNCTION TRIGGERED');
    console.log('[DEBUG] handleDelete called for:', productId);
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this product from local database?')) return;
    
    setLoading(`delete-${productId}`);
    try {
      const res = await fetch(`/api/admin/inventory/delete?id=${productId}`, { method: 'DELETE' });
      const data = await res.json();
      console.log('[DEBUG] Delete response:', data);

      if (data.success) {
        setProducts(products.filter(p => p.id !== productId));
        alert('SUCCESS: Product deleted');
      } else {
        alert('FAILED: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('[DEBUG] Delete error:', err);
      alert('CRASH: ' + err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteVariant = async (e: React.MouseEvent, productId: string, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this specific variant?')) return;

    setLoading(`delete-variant-${variantId}`);
    try {
      const res = await fetch(`/api/admin/inventory/delete?variantId=${variantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map(p => {
          if (p.id === productId) {
            return { ...p, variants: p.variants.filter(v => v.id !== variantId) };
          }
          return p;
        }));
        alert('Variant deleted');
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
            <th style={thStyle}>PRODUCT</th>
            <th style={thStyle}>VARIANTS</th>
            <th style={thStyle}>TOTAL STOCK</th>
            <th style={thStyle}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>
                No products imported yet. Go to Importer to add products.
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <React.Fragment key={p.id}>
                <tr 
                  style={{ 
                    borderBottom: '1px solid #e4e4e7',
                    background: expandedId === p.id ? '#fbfcfe' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  className="inventory-row"
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {/* Expand Toggle */}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('[DEBUG] Toggling expand for:', p.id);
                          toggleExpand(p.id);
                        }}
                        style={{ 
                          background: 'none', border: 'none', cursor: 'pointer', 
                          fontSize: '1.2rem', padding: '0.25rem', color: '#71717a',
                          transform: expandedId === p.id ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s'
                        }}
                      >
                        ›
                      </button>

                      <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #f4f4f5' }}>
                        <Image src={p.images[0] || '/placeholder.png'} alt={p.name} fill style={{ objectFit: 'cover' }} unoptimized />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#09090b' }}>{p.name.length > 60 ? p.name.substring(0, 60) + '...' : p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>CJ ID: {p.cjId}</div>
                        <div style={{ marginTop: '4px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleHero(p.id, p.isHero); }}
                            disabled={loading === `hero-${p.id}`}
                            style={{
                              background: p.isHero ? '#fef9c3' : '#f4f4f5',
                              color: p.isHero ? '#854d0e' : '#71717a',
                              border: p.isHero ? '1px solid #fde047' : '1px solid #e4e4e7',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {p.isHero ? '★ Hero Section' : '☆ Mark as Hero'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: '#f4f4f5', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                      {p.variants.length} Variants
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>
                      {p.variants.reduce((acc, v) => acc + v.inventory, 0)} units
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('[DEBUG] Sync clicked for:', p.id);
                          handleSync(e, p.id, p.cjId);
                        }}
                        disabled={loading === `sync-${p.id}`}
                        style={btnSecondary}
                      >
                        {loading === `sync-${p.id}` ? '...' : '🔄 Sync'}
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('[DEBUG] Delete clicked for:', p.id);
                          handleDelete(e, p.id);
                        }}
                        disabled={loading === `delete-${p.id}`}
                        style={btnDanger}
                      >
                        {loading === `delete-${p.id}` ? '...' : '🗑️'}
                      </button>
                      
                      {loading && (
                        <button 
                          onClick={() => {
                            console.log('[Frontend] Force resetting loading state');
                            setLoading(null);
                          }}
                          style={{ border: 'none', background: 'none', color: '#71717a', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === p.id && (
                  <tr>
                    <td colSpan={4} style={{ padding: '0', background: '#fcfcfc' }}>
                      <div style={{ padding: '1rem 1rem 2rem 5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #f4f4f5' }}>
                              <th style={innerTh}>VARIANT / SKU</th>
                              <th style={innerTh}>BASE COST</th>
                              <th style={innerTh}>SELLING PRICE</th>
                              <th style={innerTh}>STOCK</th>
                              <th style={innerTh}>ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.variants.map((v) => (
                              <tr key={v.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                                <td style={innerTd}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {v.image && (
                                      <div style={{ width: '40px', height: '40px', position: 'relative', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', border: '1px solid #f4f4f5' }}>
                                        <img 
                                          src={v.image} 
                                          alt={v.color || ''} 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                          onError={(e) => (e.currentTarget.src = '/placeholder.png')}
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <div style={{ fontWeight: 500 }}>{v.color} {v.size}</div>
                                      <div style={{ fontSize: '0.7rem', color: '#a1a1aa', fontFamily: 'monospace' }}>{v.sku}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={innerTd}>${v.baseCost.toFixed(2)}</td>
                                <td style={innerTd}>
                                  <span style={{ color: '#16a34a', fontWeight: 600 }}>${v.sellingPrice.toFixed(2)}</span>
                                </td>
                                <td style={innerTd}>
                                  <span style={{ 
                                    fontWeight: 700,
                                    color: v.inventory < 10 ? '#ef4444' : '#09090b'
                                  }}>
                                    {v.inventory}
                                  </span>
                                </td>
                                <td style={innerTd}>
                                  <button 
                                    type="button"
                                    onClick={(e) => handleDeleteVariant(e, p.id, v.id)}
                                    disabled={loading === `delete-variant-${v.id}`}
                                    style={{ ...btnDanger, padding: '4px 8px', fontSize: '0.7rem' }}
                                  >
                                    {loading === `delete-variant-${v.id}` ? '...' : '🗑️'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: '1rem', fontWeight: 600, color: '#71717a', borderBottom: '1px solid #e4e4e7' };
const tdStyle = { padding: '1rem', borderBottom: '1px solid #e4e4e7' };
const innerTh = { padding: '0.75rem', color: '#71717a', fontWeight: 600, fontSize: '0.75rem' };
const innerTd = { padding: '0.75rem' };

const btnSecondary = {
  background: 'white',
  border: '1px solid #e4e4e7',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  position: 'relative' as const,
  zIndex: 99
};

const btnDanger = {
  background: '#fef2f2',
  border: '1px solid #fee2e2',
  color: '#dc2626',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  position: 'relative' as const,
  zIndex: 99
};
