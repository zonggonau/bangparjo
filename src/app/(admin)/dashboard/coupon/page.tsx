'use client';

import { useState, useEffect } from 'react';
import { getAdminCouponsAction } from '@/lib/actions-admin';
import { saveAdminCouponAction, deleteAdminCouponAction } from '@/lib/actions-admin-content';

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  description: string | null;
  createdAt: string;
}

export default function CouponManagementPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minPurchase: '',
    maxUses: '',
    isActive: true,
    expiresAt: '',
    description: '',
  });

  const fetchCoupons = async () => {
    try {
      const data = await getAdminCouponsAction();
      if (data.success) setCoupons((data.data as any[]) || []);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const resetForm = () => {
    setForm({
      code: '',
      type: 'PERCENTAGE',
      value: '',
      minPurchase: '',
      maxUses: '',
      isActive: true,
      expiresAt: '',
      description: '',
    });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleEdit = (coupon: Coupon) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minPurchase: coupon.minPurchase ? String(coupon.minPurchase) : '',
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '',
      description: coupon.description || '',
    });
    setEditingId(coupon.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.code.trim()) {
      setError('Coupon code is required');
      return;
    }
    if (!form.value || parseFloat(form.value) <= 0) {
      setError('Value must be greater than 0');
      return;
    }

    try {
      const body: any = {
        ...(editingId ? { id: editingId } : {}),
        code: form.code.trim(),
        type: form.type,
        value: parseFloat(form.value),
        minPurchase: form.minPurchase || null,
        maxUses: form.maxUses || null,
        isActive: form.isActive,
        expiresAt: form.expiresAt || null,
        description: form.description || null,
      };

      const json = await saveAdminCouponAction(body);

      if (json.success) {
        setSuccess(editingId ? 'Coupon updated successfully!' : 'Coupon created successfully!');
        resetForm();
        setShowForm(false);
        fetchCoupons();
      } else {
        setError(json.error || 'Failed to save coupon');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const json = await deleteAdminCouponAction(id);
      if (json.success) {
        setSuccess('Coupon deleted successfully!');
        fetchCoupons();
      } else {
        setError(json.error || 'Failed to delete coupon');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const json = await saveAdminCouponAction({ id: coupon.id, isActive: !coupon.isActive });
      if (json.success) {
        fetchCoupons();
      }
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PERCENTAGE': return '% Discount';
      case 'FIXED': return 'Fixed Discount';
      case 'FREE_SHIPPING': return 'Free Shipping';
      default: return type;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'PERCENTAGE': 'bg-blue-100 text-blue-700',
      'FIXED': 'bg-purple-100 text-purple-700',
      'FREE_SHIPPING': 'bg-green-100 text-green-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <i className="fas fa-spinner fa-spin text-3xl text-[#FF6B00]"></i>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-[#1A1A1A]">Coupon Management</h1>
          <p className="text-gray-500 mt-1">Create and manage discount coupons & free shipping codes</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200"
        >
          <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i>
          {showForm ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[10px] text-red-600 text-sm font-semibold flex items-center gap-3">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-[10px] text-green-600 text-sm font-semibold flex items-center gap-3">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-[16px] p-6 mb-8">
          <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-6">
            {editingId ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-gray-500 uppercase">Coupon Code *</label>
              <input
                type="text"
                placeholder="e.g. SAVE20"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-gray-500 uppercase">Discount Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>

            {form.type !== 'FREE_SHIPPING' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-gray-500 uppercase">
                  {form.type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount ($)'} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={form.type === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 10.00'}
                  value={form.value}
                  onChange={e => setForm({ ...form, value: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors"
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-gray-500 uppercase">Min Purchase ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 50.00 (leave empty for no minimum)"
                value={form.minPurchase}
                onChange={e => setForm({ ...form, minPurchase: e.target.value })}
                className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-gray-500 uppercase">Max Uses</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 100 (leave empty for unlimited)"
                value={form.maxUses}
                onChange={e => setForm({ ...form, maxUses: e.target.value })}
                className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-gray-500 uppercase">Expires At</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-gray-500 uppercase">Description</label>
              <input
                type="text"
                placeholder="e.g. Summer Sale 2024"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="px-4 py-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B00]"></div>
              </label>
              <span className="text-sm font-semibold text-gray-600">Active</span>
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-[8px] font-bold text-sm bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200"
              >
                <i className={`fas ${editingId ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                {editingId ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="px-6 py-3 rounded-[8px] font-bold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupon List */}
      {coupons.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-[16px]">
          <div className="text-5xl mb-4 opacity-30">🏷️</div>
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">No Coupons Yet</h3>
          <p className="text-gray-500 mb-6">Create your first coupon to start offering discounts!</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200"
          >
            <i className="fas fa-plus"></i>
            Create Coupon
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[16px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.5px]">Code</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.5px]">Type</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.5px]">Value</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.5px]">Usage</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.5px]">Min Purchase</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.5px]">Expires</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.5px]">Status</th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.5px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-[15px] text-[#1A1A1A]">{coupon.code}</span>
                      {coupon.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{coupon.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-[6px] text-[11px] font-bold ${getTypeBadge(coupon.type)}`}>
                        {getTypeLabel(coupon.type)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#1A1A1A]">
                      {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : 
                       coupon.type === 'FREE_SHIPPING' ? '—' : `$${coupon.value.toFixed(2)}`}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {coupon.usedCount}
                        {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {coupon.minPurchase ? `$${coupon.minPurchase.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm ${isExpired(coupon.expiresAt) ? 'text-red-500' : 'text-gray-600'}`}>
                        {formatDate(coupon.expiresAt)}
                        {isExpired(coupon.expiresAt) && <span className="ml-1 text-[10px] font-bold text-red-500">(Expired)</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-all ${
                          coupon.isActive
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 rounded-[8px] text-gray-400 hover:text-[#FF6B00] hover:bg-orange-50 transition-all"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 rounded-[8px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
