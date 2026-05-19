'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

type TabType = 'profile' | 'logistics' | 'margins';

export default function SettingsPage() {
  const { settings: currentSettings, refreshSettings } = useSettings();
  const [draft, setDraft] = useState(currentSettings);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDraft(currentSettings);
  }, [currentSettings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
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
        <p className="text-[#64748B] font-semibold">Configure your store identity, logistics, and pricing strategies.</p>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm">
        <div className="p-5 border-b border-[#E2E8F0]">
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-[12px]">
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'profile' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-store"></i> Store Profile
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'logistics' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => setActiveTab('logistics')}
            >
              <i className="fas fa-truck"></i> Logistics
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'margins' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => setActiveTab('margins')}
            >
              <i className="fas fa-percentage"></i> Pricing
            </button>
          </div>
        </div>

        <div className="p-10">
          {activeTab === 'profile' && (
            <div className="grid gap-6">
              <div>
                <label className={labelClass}>Store Identity Name</label>
                <input type="text" className={inputClass} value={draft.storeName} onChange={e => setDraft({...draft, storeName: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Administrative Email</label>
                <input type="email" className={inputClass} value={draft.adminEmail} onChange={e => setDraft({...draft, adminEmail: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Base Display Currency</label>
                <select className={inputClass} value={draft.currencySymbol} onChange={e => setDraft({...draft, currencySymbol: e.target.value})}>
                   <option value="USD">USD ($) — International</option>
                   <option value="IDR">IDR (Rp) — Indonesia</option>
                   <option value="EUR">EUR (€) — Europe</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'logistics' && (
            <div className="grid gap-6">
              <div>
                <label className={labelClass}>Shipping Service Markup ({draft.currencySymbol})</label>
                <input type="number" className={inputClass} value={draft.shippingMarkup} onChange={e => setDraft({...draft, shippingMarkup: Number(e.target.value)})} />
                <p className="text-[11px] text-gray-400 mt-2">Added to the real carrier cost as a handling fee.</p>
              </div>
              <div>
                <label className={labelClass}>Default Tax Rate (%)</label>
                <input type="number" className={inputClass} value={draft.taxPct} onChange={e => setDraft({...draft, taxPct: Number(e.target.value)})} />
              </div>
            </div>
          )}

          {activeTab === 'margins' && (
            <div className="grid gap-8">
              <div>
                <label className={labelClass}>Default Global Markup (%)</label>
                <input type="number" className={inputClass} value={draft.markupPct} onChange={e => setDraft({...draft, markupPct: Number(e.target.value)})} />
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

          <div className="mt-12 pt-8 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className={`text-sm font-bold ${message.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>{message}</span>
            <button className="inline-flex items-center gap-2.5 px-10 py-4 rounded-[12px] font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200 disabled:opacity-50" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Updating...</> : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
