'use client';

import { useState, useEffect } from 'react';
import { createCategoryAction, startImportCategoryAction, getImportProgressAction } from '@/lib/actions-admin-categories';
import { useRouter } from 'next/navigation';

export default function CategoriesClientView({ categories }: { categories: any[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', cjId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [importState, setImportState] = useState<any>(null);

  // Poll for import progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkProgress = async () => {
      const res = await getImportProgressAction();
      if (res.success && res.data) {
        setImportState(res.data);
      }
    };
    
    checkProgress();
    interval = setInterval(checkProgress, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const openNew = () => {
    setForm({ name: '', slug: '', cjId: '' });
    setError('');
    setShowModal(true);
  };

  const handleImport = async (cjId: string) => {
    if (!cjId) {
      alert('This category does not have a CJ ID set.');
      return;
    }
    if (importState?.status === 'RUNNING') {
      alert('Another import is currently running. Please wait.');
      return;
    }
    if (!confirm('This will import all products for this category in the background. Continue?')) return;
    
    const res = await startImportCategoryAction(cjId);
    if (res.success) {
      // Optimistic update
      setImportState({ status: 'RUNNING', currentCategory: cjId, currentPage: 1 });
    } else {
      alert(res.error || 'Failed to start import');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    const res = await createCategoryAction(form);
      
    if (res.success) {
      setShowModal(false);
      router.refresh();
    } else {
      setError(res.error || 'Something went wrong');
    }
    setSubmitting(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Categories</h2>
          <p className="text-[#64748B] font-semibold">Organize your products into categories.</p>
        </div>
        <button onClick={openNew} className="bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e55e00] transition-colors shadow-lg shadow-orange-500/30">
          + Add Category
        </button>
      </div>

      {importState?.status === 'RUNNING' && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-[12px] mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="fas fa-spinner fa-spin text-blue-500 text-xl"></i>
            <div>
              <h4 className="font-bold text-blue-800 text-sm">Background Import Running</h4>
              <p className="text-blue-600 text-xs mt-1">
                Currently fetching page {importState.currentPage} for Category CJ ID: <strong>{importState.currentCategory}</strong>
              </p>
            </div>
          </div>
          <div className="text-blue-500 font-bold text-xs uppercase tracking-wider bg-blue-100 px-3 py-1.5 rounded-full">
            In Progress
          </div>
        </div>
      )}

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Name</th>
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">CJ ID</th>
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Products</th>
                <th className="text-right px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-20 text-[#64748B] font-bold">No categories found.</td></tr>
              ) : categories.map((cat: any) => {
                const isThisImporting = importState?.status === 'RUNNING' && importState?.currentCategory === cat.cjId;
                
                return (
                  <tr key={cat.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                    <td className="px-8 py-5 text-sm font-bold text-[#1E293B]">{cat.name}</td>
                    <td className="px-8 py-5 text-sm font-mono text-[#64748B] bg-gray-50 rounded px-2">{cat.cjId || '-'}</td>
                    <td className="px-8 py-5 text-sm font-bold text-[#1E293B]">{cat._count?.products || 0}</td>
                    <td className="px-8 py-5 text-right">
                      {isThisImporting ? (
                        <span className="text-blue-500 text-xs font-bold flex items-center justify-end gap-2">
                          <i className="fas fa-circle-notch fa-spin"></i> Importing...
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleImport(cat.cjId)} 
                          className="px-3 py-1.5 rounded-[8px] text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] transition-all shadow-sm flex items-center gap-2 ml-auto"
                          title="Import all products from this category"
                        >
                          <i className="fas fa-download"></i> Import
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">New Category</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {error && <div className="mb-4 text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg">{error}</div>}
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => {
                    setForm({ 
                      ...form, 
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                    });
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">CJ Category ID (Required for Import)</label>
                <input
                  type="text"
                  value={form.cjId}
                  onChange={e => setForm({ ...form, cjId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none"
                  placeholder="e.g. 5f4e3c2b1a"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 border border-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="bg-[#FF6B00] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#e55e00] disabled:opacity-50 shadow-lg shadow-orange-500/30">
                  {submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
