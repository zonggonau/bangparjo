'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { updateStoreSettingsAction } from '@/lib/actions';
import { getAdminWebhooksAction, saveAdminWebhookSettingsAction } from '@/lib/actions-admin-webhooks';

export default function SettingsPage() {
  const { settings: currentSettings, refreshSettings } = useSettings();
  const [draft, setDraft] = useState(currentSettings);
  const [activeTab, setActiveTab] = useState<'profile' | 'logistics' | 'margins' | 'webhooks'>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Webhook draft state
  const [webhookDraft, setWebhookDraft] = useState({ url: '', secret: '', events: [] as string[] });
  const [webhookLoading, setWebhookLoading] = useState(false);

  useEffect(() => {
    setDraft(currentSettings);
  }, [currentSettings]);

  useEffect(() => {
    async function loadWebhookSettings() {
      try {
        const res = await getAdminWebhooksAction('settings');
        if (res.success && res.data) {
          const data = res.data as { url: string; secret: string; events: string[] };
          setWebhookDraft({
            url: data.url,
            secret: data.secret,
            events: data.events,
          });
        }
      } catch (err) {
        console.error('Failed to load webhook settings:', err);
      }
    }
    loadWebhookSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await updateStoreSettingsAction(draft);
      if (res.success) {
        await refreshSettings();
        setMessage('✅ Settings saved successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ System error occurred');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-[10px] border border-[#E2E8F0] bg-gray-50 text-sm font-semibold outline-none focus:border-[#FF6B00] focus:shadow-[0_0_0_4px_#FFF3E0] focus:bg-white transition-all duration-200";
  const labelClass = "block font-extrabold text-xs uppercase tracking-[0.05em] text-[#64748B] mb-2";

  return (
    <div className="max-w-[800px]">
      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Store Settings</h2>
        <p className="text-[#64748B] font-semibold">Configure your basic store details, logistics, and pricing margins.</p>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] bg-gray-50/50">
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-[12px] w-fit">
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'profile' ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => {
                setActiveTab('profile');
                setMessage('');
              }}
            >
              <i className="fas fa-store mr-2"></i> Store Profile
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'logistics' ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => {
                setActiveTab('logistics');
                setMessage('');
              }}
            >
              <i className="fas fa-truck mr-2"></i> Logistics
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'margins' ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => {
                setActiveTab('margins');
                setMessage('');
              }}
            >
              <i className="fas fa-percentage mr-2"></i> Pricing
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'webhooks' ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => {
                setActiveTab('webhooks');
                setMessage('');
              }}
            >
              <i className="fas fa-network-wired mr-2"></i> Webhooks
            </button>
          </div>
        </div>

        <div className="p-10">
          {activeTab === 'profile' && (
            <div className="grid gap-6">
              <div>
                <label className={labelClass}>Store Identity Name</label>
                <input type="text" className={inputClass} value={draft.storeName || ''} onChange={e => setDraft({...draft, storeName: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Administrative Email</label>
                <input type="email" className={inputClass} value={draft.adminEmail || ''} onChange={e => setDraft({...draft, adminEmail: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Base Display Currency</label>
                <select className={inputClass} value={draft.currencySymbol || 'USD'} onChange={e => setDraft({...draft, currencySymbol: e.target.value})}>
                   <option value="USD">USD ($) — International</option>
                   <option value="IDR">IDR (Rp) — Indonesia</option>
                   <option value="EUR">EUR (€) — Europe</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>CJ Fulfillment Payment Mode</label>
                <select className={inputClass} value={draft.cjPayType ?? 3} onChange={e => setDraft({...draft, cjPayType: Number(e.target.value)})}>
                   <option value={2}>Auto Balance Payment (Type 2)</option>
                   <option value={3}>Manual CJ Payment (Type 3)</option>
                </select>
                <p className="mt-2 text-xs font-semibold text-[#64748B] leading-relaxed transition-all duration-200">
                  {draft.cjPayType === 2 
                    ? "💡 Type 2: Automatically pays CJ using your CJ balance upon order sync. Ensure your CJ account has sufficient balance." 
                    : "💡 Type 3: Syncs the order to CJ as an unpaid order. You must pay manually in the CJ platform dashboard."
                  }
                </p>
              </div>
            </div>
          )}

          {activeTab === 'logistics' && (
            <div className="grid gap-6">
              <div>
                <label className={labelClass}>Shipping Service Markup ({draft.currencySymbol || 'USD'})</label>
                <input type="number" className={inputClass} value={draft.shippingMarkup ?? 0} onChange={e => setDraft({...draft, shippingMarkup: Number(e.target.value)})} />
                <p className="text-[11px] text-gray-400 mt-2">Added to the real carrier cost as a handling fee.</p>
              </div>
              <div>
                <label className={labelClass}>Default Tax Rate (%)</label>
                <input type="number" className={inputClass} value={draft.taxPct ?? 0} onChange={e => setDraft({...draft, taxPct: Number(e.target.value)})} />
              </div>
            </div>
          )}

          {activeTab === 'margins' && (
            <div className="grid gap-8">
              <div>
                <label className={labelClass}>Default Global Markup (%)</label>
                <input type="number" className={inputClass} value={draft.markupPct ?? 0} onChange={e => setDraft({...draft, markupPct: Number(e.target.value)})} />
              </div>
              
              <div className="p-8 bg-gray-50 rounded-[16px] border border-[#E2E8F0]">
                <h4 className="text-[15px] font-black mb-2 text-[#1E293B]">Tiered Strategy Management</h4>
                <p className="text-xs text-gray-500 mb-6">Automated profit margins based on wholesale product cost ranges.</p>

                <div className="grid gap-3">
                  {draft.marginTiers?.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-[12px] border border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-500">$</span>
                        <input 
                          type="number" value={tier.min} className={`${inputClass} w-[90px] p-2`}
                          onChange={e => {
                            const nt = [...(draft.marginTiers || [])];
                            nt[idx].min = Number(e.target.value);
                            setDraft({...draft, marginTiers: nt});
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-black text-gray-300"><i className="fas fa-chevron-right"></i></span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-500">$</span>
                        <input 
                          type="number" value={tier.max === null ? '' : tier.max} placeholder="∞" className={`${inputClass} w-[90px] p-2`}
                          onChange={e => {
                            const nt = [...(draft.marginTiers || [])];
                            nt[idx].max = e.target.value === '' ? null : Number(e.target.value);
                            setDraft({...draft, marginTiers: nt});
                          }}
                        />
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        <span className="text-[11px] font-extrabold text-gray-500 uppercase">Markup</span>
                        <div className="relative">
                          <input 
                            type="number" value={tier.pct} className={`${inputClass} w-[70px] p-2 pr-7 text-right`}
                            onChange={e => {
                              const nt = [...(draft.marginTiers || [])];
                              nt[idx].pct = Number(e.target.value);
                              setDraft({...draft, marginTiers: nt});
                            }}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-500">%</span>
                        </div>
                        <button 
                          className="px-2 py-1 rounded-[8px] text-sm text-red-500 hover:bg-red-50 transition-all duration-200"
                          onClick={() => setDraft({...draft, marginTiers: draft.marginTiers?.filter((_, i) => i !== idx)})}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    className="w-full py-3 rounded-[8px] text-sm font-semibold border-2 border-dashed border-[#E2E8F0] text-[#FF6B00] hover:bg-orange-50 transition-all duration-200 mt-3"
                    onClick={() => setDraft({...draft, marginTiers: [...(draft.marginTiers || []), { min: 0, max: null, pct: 30 }]})}
                  >
                    <i className="fas fa-plus-circle"></i> Define New Range
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="grid gap-6">
              <div>
                <label className={labelClass}>Webhook Target URL</label>
                <input 
                  type="url" 
                  className={inputClass} 
                  placeholder="https://yourstore.com/api/cjdropship/webhook" 
                  value={webhookDraft.url} 
                  onChange={e => setWebhookDraft({...webhookDraft, url: e.target.value})} 
                />
                <p className="text-[11px] text-gray-400 mt-2">
                  The HTTPS URL of your store's webhook receiver. This will be registered automatically to CJ.
                </p>
              </div>

              <div>
                <label className={labelClass}>Webhook Secret Token</label>
                <input 
                  type="text" 
                  className={inputClass} 
                  placeholder="Enter a secret token to secure callbacks" 
                  value={webhookDraft.secret} 
                  onChange={e => setWebhookDraft({...webhookDraft, secret: e.target.value})} 
                />
                <p className="text-[11px] text-gray-400 mt-2">
                  Used locally to authenticate incoming webhook packets.
                </p>
              </div>

              <div>
                <label className={labelClass}>Monitor Event Topics (V2.0)</label>
                <div className="grid gap-3 mt-3 bg-gray-50 p-6 rounded-[12px] border border-[#E2E8F0]">
                  {[
                    { id: 'PRODUCT', label: 'Product Updates (PRODUCT)', desc: 'Variant price, stock status, or descriptions updates.' },
                    { id: 'STOCK', label: 'Real-time Stock Levels (STOCK)', desc: 'Live variant warehouse inventory updates.' },
                    { id: 'ORDER', label: 'CJ Order State Transitions (ORDER)', desc: 'Order placed, pay confirmation, or split alerts.' },
                    { id: 'LOGISTIC', label: 'Live Delivery & Waybills (LOGISTIC)', desc: 'Carrier waybill generation and tracking steps.' },
                  ].map(topic => {
                    const isChecked = webhookDraft.events.includes(topic.id);
                    return (
                      <label key={topic.id} className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1 accent-[#FF6B00]" 
                          checked={isChecked}
                          onChange={() => {
                            const newEvents = isChecked 
                              ? webhookDraft.events.filter(e => e !== topic.id)
                              : [...webhookDraft.events, topic.id];
                            setWebhookDraft({...webhookDraft, events: newEvents});
                          }}
                        />
                        <div>
                          <span className="text-sm font-bold text-[#1E293B]">{topic.label}</span>
                          <p className="text-xs text-gray-400 mt-0.5">{topic.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className={`text-sm font-bold ${message.includes('✅') ? 'text-green-600' : 'text-red-500'} ${message.includes('⚠️') ? 'text-amber-500' : ''}`}>{message}</span>
                <button 
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-[12px] font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200 disabled:opacity-50"
                  onClick={async () => {
                    setWebhookLoading(true);
                    setMessage('');
                    try {
                      const res = await saveAdminWebhookSettingsAction(webhookDraft.url, webhookDraft.secret, webhookDraft.events);
                      if (res.success) {
                        if ((res as any).warning) {
                          setMessage(`⚠️ ${(res as any).warning}`);
                        } else {
                          setMessage('✅ Webhooks successfully registered & saved!');
                          setTimeout(() => setMessage(''), 4000);
                        }
                      } else {
                        setMessage(`❌ Error: ${res.error || 'Failed to save'}`);
                      }
                    } catch (err: any) {
                      setMessage(`❌ Error: ${err.message}`);
                    } finally {
                      setWebhookLoading(false);
                    }
                  }}
                  disabled={webhookLoading}
                >
                  {webhookLoading ? <><i className="fas fa-spinner fa-spin"></i> Syncing...</> : 'Sync & Register Webhooks'}
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'webhooks' && (
            <div className="mt-12 pt-8 border-t border-[#E2E8F0] flex items-center justify-between">
              <span className={`text-sm font-bold ${message.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>{message}</span>
              <button className="inline-flex items-center gap-2.5 px-10 py-4 rounded-[12px] font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Updating...</> : 'Save Configuration'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
