'use client';

import { useState, useEffect } from 'react';

interface AboutData {
  id: string;
  title: string;
  content: string;
  image: string | null;
  mission: string | null;
  vision: string | null;
  published: boolean;
}

export default function AdminAboutPage() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    title: 'About Us',
    content: '',
    image: '',
    mission: '',
    vision: '',
    published: true,
  });

  const loadAbout = () => {
    setLoading(true);
    fetch('/api/admin/about')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setAbout(data.data);
          setForm({
            title: data.data.title || 'About Us',
            content: data.data.content || '',
            image: data.data.image || '',
            mission: data.data.mission || '',
            vision: data.data.vision || '',
            published: data.data.published ?? true,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAbout(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const method = about ? 'PUT' : 'POST';
      const body = about ? { id: about.id, ...form } : form;

      const res = await fetch('/api/admin/about', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setMessage('✅ About page saved!');
        loadAbout();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[900px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">About Page</h1>
        <p className="text-sm text-gray-500">Manage your About Us page content</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML) *</label>
          <textarea
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            rows={15}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
            required
            placeholder="<h2>About Our Store</h2><p>Write your story here...</p>"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input
            type="text"
            value={form.image}
            onChange={e => setForm({ ...form, image: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
            placeholder="https://example.com/about-image.jpg"
          />
          {form.image && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 h-32">
              <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mission Statement</label>
            <textarea
              value={form.mission}
              onChange={e => setForm({ ...form, mission: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
              placeholder="Our mission is to..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vision Statement</label>
            <textarea
              value={form.vision}
              onChange={e => setForm({ ...form, vision: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
              placeholder="Our vision is to..."
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={e => setForm({ ...form, published: e.target.checked })}
              className="w-4 h-4 text-[#FF6B00] focus:ring-[#FF6B00] rounded"
            />
            <span className="text-sm text-gray-700">Published (visible to visitors)</span>
          </label>
        </div>

        {message && (
          <div className="mb-4 text-sm font-medium">{message}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-[#FF6B00] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#e55e00] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : about ? '💾 Update About Page' : '📝 Create About Page'}
        </button>
      </form>
    </div>
  );
}
