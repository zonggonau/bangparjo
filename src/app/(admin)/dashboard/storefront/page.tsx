'use client';

import { useState, useEffect } from 'react';
import { getStoreSettingsAction, updateStoreSettingsAction } from '@/lib/actions';

export default function StorefrontPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [form, setForm] = useState({
    heroHeadline: '',
    heroSubheadline: '',
    heroImage: '',
  });

  const loadSettings = () => {
    setLoading(true);
    getStoreSettingsAction()
      .then(res => {
        if (res.success && res.data) {
          setForm({
            heroHeadline: res.data.heroHeadline || '',
            heroSubheadline: res.data.heroSubheadline || '',
            heroImage: res.data.heroImage || '',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSettings(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const currentRes = await getStoreSettingsAction();
      if (!currentRes.success) throw new Error('Failed to fetch current settings');
      
      const currentSettings = currentRes.data || {};
      const newSettings = {
        ...currentSettings,
        heroHeadline: form.heroHeadline,
        heroSubheadline: form.heroSubheadline,
        heroImage: form.heroImage,
      };

      const res = await updateStoreSettingsAction(newSettings);
      if (res.success) {
        setMessage('✅ Storefront settings saved successfully!');
        // Update local storage for client components
        localStorage.setItem('admin_settings', JSON.stringify(newSettings));
      } else {
        setMessage(`❌ ${res.error}`);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[900px]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px]">
      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Storefront Appearance</h2>
        <p className="text-[#64748B] font-semibold">Customize your homepage layout and texts.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h3 className="text-lg font-bold text-[#1E293B] mb-1">Hero Section</h3>
          <p className="text-sm text-[#64748B]">These elements appear at the top of your homepage.</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Main Headline</label>
            <input
              type="text"
              value={form.heroHeadline}
              onChange={e => setForm({ ...form, heroHeadline: e.target.value })}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all"
              placeholder="e.g. Discover Premium Products"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Subheadline</label>
            <textarea
              value={form.heroSubheadline}
              onChange={e => setForm({ ...form, heroSubheadline: e.target.value })}
              rows={2}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all"
              placeholder="e.g. High quality items at unbeatable prices..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Hero Background Image URL</label>
            <input
              type="text"
              value={form.heroImage}
              onChange={e => setForm({ ...form, heroImage: e.target.value })}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all"
              placeholder="https://example.com/banner.jpg"
            />
            {form.heroImage && (
              <div className="mt-4 rounded-xl overflow-hidden border border-[#E2E8F0] h-48 relative">
                <img src={form.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center p-6">
                  <h1 className="text-white text-3xl font-black mb-2">{form.heroHeadline || 'Headline'}</h1>
                  <p className="text-white/90 text-sm max-w-md">{form.heroSubheadline || 'Subheadline'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="text-sm font-bold text-[#10B981]">{message}</div>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FF6B00] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#e55e00] transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
