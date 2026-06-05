'use client';

import { useState } from 'react';
import { fixAllProductCategoriesAction } from '@/lib/actions-admin-inventory';

/**
 * Button to fix category links for all products in the database.
 * Uses the database-only sync logic to match cjCategoryId with local Category IDs.
 */
export default function FixCategoryLinksButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; fixed?: number } | null>(null);

  async function handleFix() {
    if (!confirm('Fix all product category links using local database data?\n\nThis will attempt to link products to categories based on cjCategoryId and Category names in your DB.')) return;
    
    setLoading(true);
    setResult(null);
    try {
      const res = await fixAllProductCategoriesAction();
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
        onClick={handleFix}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
          color: 'white',
          boxShadow: loading ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.3)',
        }}
        title="Fix product category links using local DB lookup"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Fixing Links...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Fix Category Links
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
            ? `✅ ${result.message || `Fixed ${result.fixed} links`}`
            : `❌ ${result.message || 'Failed'}`}
        </div>
      )}
    </div>
  );
}
