'use client';

import { useState, useEffect } from 'react';

export default function WebhookSettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');

  const allEvents = [
    'order.created', 'order.updated', 'order.shipped', 'order.delivered', 'order.cancelled',
    'product.created', 'product.updated', 'product.deleted',
    'tracking.created', 'tracking.updated',
  ];

  useEffect(() => {
    fetch('/api/admin/webhooks?type=settings')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setWebhookUrl(res.data.url || '');
          setSecret(res.data.secret || '');
          setEvents(res.data.events || []);
        }
      })
      .catch(console.error);
  }, []);

  const toggleEvent = (evt: string) => {
    setEvents(prev => prev.includes(evt) ? prev.filter(e => e !== evt) : [...prev, evt]);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, secret, events }),
      });
      const data = await res.json();
      if (data.success) setMessage('✅ Webhook settings saved successfully!');
      else setMessage('❌ ' + (data.error || 'Failed to save'));
    } catch (err: any) {
      setMessage('❌ ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/test-webhook', { method: 'POST' });
      const data = await res.json();
      if (data.success) setMessage('✅ Test webhook sent!');
      else setMessage('⚠️ ' + (data.error || 'Test failed'));
    } catch (err: any) {
      setMessage('❌ ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-8">
        <h3 className="text-lg font-extrabold text-[#1E293B] mb-6">Webhook Configuration</h3>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#64748B] mb-2">Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#64748B] mb-2">Secret Key</label>
            <input
              type="text"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Your webhook secret"
              className="w-full px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#64748B] mb-3">Subscribe to Events</label>
            <div className="grid grid-cols-2 gap-2">
              {allEvents.map(evt => (
                <label key={evt} className="flex items-center gap-2 p-2 rounded-[8px] hover:bg-[#F8FAFC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={events.includes(evt)}
                    onChange={() => toggleEvent(evt)}
                    className="accent-[#FF6B00]"
                  />
                  <span className="text-sm text-[#1E293B]">{evt}</span>
                </label>
              ))}
            </div>
          </div>

          {message && (
            <div className="text-sm font-semibold p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-[12px] bg-[#FF6B00] text-white font-bold text-sm hover:bg-[#E85E00] disabled:opacity-50 transition-all"
            >
              {saving ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              Save Settings
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-6 py-3 rounded-[12px] border border-[#E2E8F0] text-[#1E293B] font-bold text-sm hover:bg-[#F8FAFC] disabled:opacity-50 transition-all"
            >
              {testing ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              Test Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
