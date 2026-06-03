'use client';

import { useState } from 'react';
import { recalculateAllPricesAction } from '@/lib/actions-admin-inventory';

/**
 * Tombol "Recalculate All Prices" di admin Inventory.
 * Memanggil recalculateAllPricesAction untuk menghitung ulang
 * sellingPrice semua varian berdasarkan margin settings terkini.
 *
 * Digunakan untuk update produk lama yang sellingPrice-nya belum include margin.
 */
export default function RecalculatePricesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; updated?: number } | null>(null);

  async function handleRecalculate() {
    if (!confirm('Recalculate sellingPrice semua varian berdasarkan margin terkini?\n\nProses ini akan update seluruh produk di DB.')) return;
    
    setLoading(true);
    setResult(null);
    try {
      const res = await recalculateAllPricesAction();
      setResult(res);
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleRecalculate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #FF6B35, #E8551E)',
          color: 'white',
          boxShadow: loading ? 'none' : '0 4px 15px rgba(255, 107, 53, 0.3)',
        }}
        title="Hitung ulang sellingPrice semua varian berdasarkan margin settings terkini"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Recalculating...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Recalculate All Prices
          </>
        )}
      </button>

      {result && (
        <div
          className="text-xs px-3 py-2 rounded-lg font-semibold max-w-xs text-right"
          style={{
            background: result.success ? '#d1fae5' : '#fee2e2',
            color: result.success ? '#065f46' : '#991b1b',
            border: `1px solid ${result.success ? '#6ee7b7' : '#fca5a5'}`,
          }}
        >
          {result.success
            ? `✅ ${result.message || `Updated ${result.updated} variants`}`
            : `❌ ${result.message || 'Failed'}`}
        </div>
      )}
    </div>
  );
}
