'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const [form, setForm] = useState({
    label: 'Home',
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    isDefault: false,
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetchAddresses();
  }, [session]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`/api/account/addresses?email=${encodeURIComponent(session?.user?.email || '')}`);
      const data = await res.json();
      if (data.success) setAddresses(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'US', isDefault: false });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (addr: Address) => {
    setForm({
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.line1 || !form.city || !form.state || !form.zip) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...form, id: editingId, email: session?.user?.email } : { ...form, email: session?.user?.email };

      const res = await fetch('/api/account/addresses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingId ? 'Address updated!' : 'Address added!');
        resetForm();
        fetchAddresses();
      } else showToast(data.error || 'Failed to save', 'error');
    } catch (e: any) { showToast('Error: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email: session?.user?.email }),
      });
      const data = await res.json();
      if (data.success) { showToast('Address deleted!'); fetchAddresses(); }
      else showToast(data.error || 'Failed to delete', 'error');
    } catch (e: any) { showToast('Error: ' + e.message, 'error'); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email: session?.user?.email, setDefault: true }),
      });
      const data = await res.json();
      if (data.success) { showToast('Default address updated!'); fetchAddresses(); }
    } catch (e: any) { showToast('Error: ' + e.message, 'error'); }
  };

  if (status === 'loading' || loading) {
    return <div className="py-[100px] text-center"><i className="fas fa-spinner fa-spin fa-2x text-[#FF6B00]"></i></div>;
  }

  if (!session) return null;

  return (
    <>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i> {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">My Addresses</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your shipping addresses</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200" onClick={() => { resetForm(); setShowForm(true); }}>
          <i className="fas fa-plus"></i> Add New
        </button>
      </div>

      {/* Address Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-white rounded-[16px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-[#1A1A1A]">{editingId ? 'Edit Address' : 'New Address'}</h3>
              <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-all cursor-pointer" onClick={resetForm}>&times;</button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                {['Home', 'Office', 'Other'].map(label => (
                  <button key={label} className={`px-4 py-2 rounded-[8px] text-sm font-bold border transition-all duration-200 cursor-pointer ${form.label === label ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setForm(f => ({ ...f, label }))}>{label}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-xs font-semibold text-gray-600 mb-1 block">Full Name *</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-[10px] border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B00]" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="col-span-2"><label className="text-xs font-semibold text-gray-600 mb-1 block">Phone *</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-[10px] border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B00]" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="col-span-2"><label className="text-xs font-semibold text-gray-600 mb-1 block">Address Line 1 *</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-[10px] border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B00]" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} /></div>
                <div className="col-span-2"><label className="text-xs font-semibold text-gray-600 mb-1 block">Address Line 2</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-[10px] border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B00]" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} /></div>
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">City *</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-[10px] border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B00]" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">State *</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-[10px] border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B00]" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">ZIP Code *</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-[10px] border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B00]" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} /></div>
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Country</label>
                  <select className="w-full px-4 py-2.5 rounded-[10px] border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B00]" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="ID">Indonesia</option>
                  </select></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
                <span className="text-sm font-semibold text-gray-600">Set as default address</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-5 py-2.5 rounded-[10px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                  <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {saving ? 'Saving...' : (editingId ? 'Update' : 'Save')}
                </button>
                <button className="px-5 py-2.5 rounded-[10px] text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-gray-200 p-10 text-center">
          <div className="text-[40px] opacity-10 mb-4"><i className="fas fa-map-marker-alt"></i></div>
          <h3 className="font-bold text-[#1A1A1A] mb-2">No Addresses Yet</h3>
          <p className="text-sm text-gray-500 mb-6">Add a shipping address for faster checkout.</p>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] transition-all duration-200" onClick={() => setShowForm(true)}>
            <i className="fas fa-plus"></i> Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`bg-white rounded-[12px] border p-5 relative ${addr.isDefault ? 'border-[#FF6B00]' : 'border-gray-200'}`}>
              {addr.isDefault && (
                <span className="absolute top-3 right-3 text-[10px] font-extrabold uppercase bg-[#FFEDD5] text-[#9A3412] px-2 py-0.5 rounded-[4px]">Default</span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-extrabold uppercase bg-gray-100 px-2 py-1 rounded-[4px]">{addr.label}</span>
              </div>
              <p className="font-bold text-sm text-[#1A1A1A]">{addr.name}</p>
              <p className="text-sm text-gray-600 mt-1">{addr.line1}</p>
              {addr.line2 && <p className="text-sm text-gray-600">{addr.line2}</p>}
              <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.zip}</p>
              <p className="text-sm text-gray-600">{addr.country}</p>
              {addr.phone && <p className="text-xs text-gray-400 mt-2"><i className="fas fa-phone"></i> {addr.phone}</p>}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button className="px-3 py-1.5 rounded-[8px] text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer" onClick={() => handleEdit(addr)}>
                  <i className="fas fa-edit"></i> Edit
                </button>
                {!addr.isDefault && (
                  <button className="px-3 py-1.5 rounded-[8px] text-xs font-bold text-[#FF6B00] border border-[#FFEDD5] hover:bg-[#FFEDD5] transition-all duration-200 cursor-pointer" onClick={() => handleSetDefault(addr.id)}>
                    Set Default
                  </button>
                )}
                <button className="px-3 py-1.5 rounded-[8px] text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all duration-200 cursor-pointer" onClick={() => handleDelete(addr.id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
