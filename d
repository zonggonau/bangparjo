'use client';

import { useState, useEffect } from 'react';

type WebhookType = 'ENABLE' | 'CANCEL';

interface WebhookConfig {
  type: WebhookType;
  callbackUrls: string[];
}

export default function WebhookSettingsPage() {
  const [baseUrl, setBaseUrl] = useState('');
  const [configs, setConfigs] = useState<Record<string, WebhookConfig>>({
    product: { type: 'CANCEL', callbackUrls: [''] },
    stock: { type: 'CANCEL', callbackUrls: [''] },
    order: { type: 'CANCEL', callbackUrls: [''] },
    logistics: { type: 'CANCEL', callbackUrls: [''] },
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  useEffect(() => {
    // Try to detect base URL
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const updateConfig = (key: string, field: keyof WebhookConfig, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const updateUrl = (key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [key]: { ...prev[key], callbackUrls: [value] }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build payload with full URLs
      const payload: Record<string, WebhookConfig> = {};
      for (const [key, cfg] of Object.entries(configs)) {
        payload[key] = {
          type: cfg.type,
          callbackUrls: cfg.callbackUrls.map(u => u.startsWith('http') ? u : `${baseUrl}${u}`),
        };
      }

      const res = await fetch('/api/cj-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api2.0/v1/webhook/set',
          method: 'POST',
          data: payload,
        }),
      });
      const data = await res.json();
      if (data.success || data.result) {
        showToast('Webhook settings saved successfully!');
      } else {
        showToast(data.message || 'Failed to save webhook settings', 'error');
      }
    } catch (e: any) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/webhooks');
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingLogs(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const eventTypes = [
    { key: 'product', label: 'Product', icon: 'fa-box', desc: 'Product creation/update/deletion events' },
    { key: 'stock', label: 'Stock', icon: 'fa-warehouse', desc: 'Inventory level change events' },
    { key: 'order', label: 'Order', icon: 'fa-shopping-cart', desc: 'Order status change events' },
    { key: 'logistics', label: 'Logistics', icon: 'fa-truck', desc: 'Shipping/tracking update events' },
  ];

  return (
    <div className="animate-fade-in">
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i> {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Webhook Settings</h2>
        <p className="text-[#64748B] font-semibold">Configure callback URLs for real-time event notifications from CJ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Event Configurations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-extrabold text-[#1E293B]">Event Configurations</h3>
            </div>
            <div className="p-6 space-y-6">
              {eventTypes.map(({ key, label, icon, desc }) => (
                <div key={key} className="bg-[#F8FAFC] rounded-[12px] p-5 border border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-[#FFEDD5] flex items-center justify-center text-[#FF6B00]">
                        <i className={`fas ${icon}`}></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1E293B]">{label}</h4>
                        <p className="text-[11px] text-[#64748B]">{desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={configs[key].type === 'ENABLE'} onChange={(e) => updateConfig(key, 'type', e.target.checked ? 'ENABLE' : 'CANCEL')} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B00]"></div>
                    </label>
                  </div>
                  {configs[key].type === 'ENABLE' && (
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-2 block">Callback URL</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#64748B] font-semibold bg-gray-100 px-3 py-2 rounded-[8px]">{baseUrl}</span>
                        <input type="text" className="flex-1 px-4 py-2 rounded-[10px] border border-[#E2E8F0] text-sm outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all" placeholder="/api/webhooks/cj/product" value={configs[key].callbackUrls[0]?.replace(baseUrl, '') || ''} onChange={(e) => updateUrl(key, e.target.value ? `${baseUrl}${e.target.value.startsWith('/') ? '' : '/'}${e.target.value}` : '')} />
                      </div>
                      <p className="text-[10px] text-[#94A3B8] mt-2">
                        <i className="fas fa-info-circle"></i> Full URL example: {baseUrl}/api/webhooks/cj/{key}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="inline-flex items-center gap-2 px-8 py-3 rounded-[12px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200 disabled:opacity-50" onClick={handleSave} disabled={saving}>
              <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Right: Webhook Logs */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="font-extrabold text-[#1E293B] flex items-center gap-2">
              <i className="fas fa-history text-[#FF6B00]"></i> Recent Logs
            </h3>
            <button className="text-[#FF6B00] text-xs font-bold no-underline hover:underline" onClick={fetchLogs}><i className="fas fa-sync"></i></button>
          </div>
          <div className="divide-y divide-[#F1F5F9] max-h-[600px] overflow-y-auto">
            {loadingLogs ? (
              <div className="p-8 text-center"><i className="fas fa-circle-notch fa-spin text-[#FF6B00]"></i></div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-[#64748B]">
                <i className="fas fa-inbox text-[32px] opacity-20 mb-3 block"></i>
                <p className="text-xs font-bold">No webhook logs yet.</p>
                <p className="text-[10px] mt-1">Webhook callbacks will appear here.</p>
              </div>
            ) : logs.map((log: any) => (
              <div key={log.id} className="px-6 py-4 hover:bg-[#FAFBFE] transition-all duration-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] bg-gray-100 px-2 py-0.5 rounded-[4px]">{log.event || log.type || 'unknown'}</span>
                  <span className={`text-[10px] font-bold ${log.success ? 'text-green-600' : 'text-red-500'}`}>{log.success ? 'Success' : 'Failed'}</span>
                </div>
                <p className="text-xs text-[#64748B] truncate">{log.url || log.callbackUrl || '-'}</p>
                <p className="text-[10px] text-[#94A3B8] mt-1">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
