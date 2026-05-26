'use client';

import { useState } from 'react';
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/lib/actions-admin-categories';
import { useRouter } from 'next/navigation';

export default function CategoriesClientView({ categories }: { categories: any[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ name: '', slug: '', cjId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', cjId: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, cjId: cat.cjId || '' });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const res = await deleteCategoryAction(id);
    if (res.success) router.refresh();
    else alert(res.error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    const res = editingId 
      ? await updateCategoryAction(editingId, form)
      : await createCategoryAction(form);
      
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

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Name</th>
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Slug</th>
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">CJ ID</th>
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Products</th>
                <th className="text-right px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-[#64748B] font-bold">No categories found.</td></tr>
              ) : categories.map((cat: any) => (
                <tr key={cat.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                  <td className="px-8 py-5 text-sm font-bold text-[#1E293B]">{cat.name}</td>
                  <td className="px-8 py-5 text-sm text-[#64748B]">{cat.slug}</td>
                  <td className="px-8 py-5 text-sm text-[#64748B]">{cat.cjId || '-'}</td>
                  <td className="px-8 py-5 text-sm font-bold text-[#1E293B]">{cat._count?.products || 0}</td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => openEdit(cat)} className="p-2 rounded-[8px] text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all mr-2" title="Edit">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-[8px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Category' : 'New Category'}</h3>
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
                      slug: editingId ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                    });
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">CJ Category ID (Optional)</label>
                <input
                  type="text"
                  value={form.cjId}
                  onChange={e => setForm({ ...form, cjId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none"
                  placeholder="e.g. 5f4e3c2b1a"
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
