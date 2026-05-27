'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { updateStoreSettingsAction } from '@/lib/actions';
import { updateAccountAction } from '@/lib/actions-user';
import { useSession } from 'next-auth/react';

type TabType = 'profile' | 'account' | 'logistics' | 'margins' | 'pages';

export default function SettingsPage() {
  const { settings: currentSettings, refreshSettings } = useSettings();
  const [draft, setDraft] = useState(currentSettings);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [accountMsg, setAccountMsg] = useState('');
  const [accSaving, setAccSaving] = useState(false);
  const [accForm, setAccForm] = useState({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
  const { data: session } = useSession();

  useEffect(() => {
    setDraft(currentSettings);
  }, [currentSettings]);

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
        setMessage('❌ Failed to save settings: ' + (res.error || 'Unknown error'));
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
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-[12px] flex-wrap">
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'profile' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-store"></i> Store Profile
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'account' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => setActiveTab('account')}
            >
              <i className="fas fa-user-cog"></i> Account
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'logistics' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => setActiveTab('logistics')}
            >
              <i className="fas fa-truck"></i> Logistics & CJ
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'margins' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => setActiveTab('margins')}
            >
              <i className="fas fa-percentage"></i> Pricing
            </button>
            <button 
              className={`px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-200 ${activeTab === 'pages' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
              onClick={() => setActiveTab('pages')}
            >
              <i className="fas fa-file-alt"></i> Static Pages
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
                <label className={labelClass}>Store Phone Number</label>
                <input type="text" className={inputClass} value={draft.phone || ''} onChange={e => setDraft({...draft, phone: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Store Physical Address</label>
                <textarea className={inputClass} rows={3} value={draft.address || ''} onChange={e => setDraft({...draft, address: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Working Hours</label>
                <input type="text" className={inputClass} value={draft.workingHours || ''} onChange={e => setDraft({...draft, workingHours: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Base Display Currency</label>
                <select className={inputClass} value={draft.currencySymbol} onChange={e => setDraft({...draft, currencySymbol: e.target.value})}>
                   <option value="USD">USD ($) — International</option>
                   <option value="IDR">IDR (Rp) — Indonesia</option>
                   <option value="EUR">EUR (€) — Europe</option>
                 </select>
              </div>
              <div className="pt-4 border-t border-[#E2E8F0]">
                <h4 className="text-[15px] font-black mb-2 text-[#1E293B]">Integrations</h4>
                <p className="text-xs text-gray-500 mb-4">Register your store's webhook URL with CJ Dropshipping to receive real-time updates for products, stock, and orders.</p>
                <button
                  className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-[8px] text-sm font-bold hover:bg-blue-100 transition-all duration-200 disabled:opacity-50"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setMessage('');
                    try {
                      // Dynamically import the action
                      const { registerCJWebhookAction } = await import('@/lib/actions-admin');
                      const baseUrl = window.location.origin;
                      const res = await registerCJWebhookAction(baseUrl);
                      if (res.success) {
                        setMessage(`✅ ${res.message}`);
                      } else {
                        setMessage(`❌ ${res.message}`);
                      }
                    } catch (err: any) {
                      setMessage(`❌ System error: ${err.message}`);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  <i className="fas fa-plug"></i> Register CJ Webhook
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="grid gap-8">
              <div>
                <label className={labelClass}>FAQ Content (HTML)</label>
                <textarea 
                  className={`${inputClass} font-mono text-xs`} 
                  rows={10} 
                  value={draft.faqContent || ''} 
                  onChange={e => setDraft({...draft, faqContent: e.target.value})}
                  placeholder="<h1>FAQ</h1><p>Answers to frequently asked questions...</p>"
                />
              </div>
              <div>
                <label className={labelClass}>Returns & Refunds Content (HTML)</label>
                <textarea 
                  className={`${inputClass} font-mono text-xs`} 
                  rows={10} 
                  value={draft.returnsContent || ''} 
                  onChange={e => setDraft({...draft, returnsContent: e.target.value})}
                  placeholder="<h1>Returns Policy</h1><p>Our returns policy details...</p>"
                />
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="grid gap-6">
              <div className="p-6 bg-blue-50 rounded-[12px] border border-blue-200 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-lg font-bold">
                    {session?.user?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1E293B]">{session?.user?.name || 'Admin'}</h4>
                    <p className="text-sm text-gray-500">{session?.user?.email}</p>
                    <p className="text-xs text-gray-400">Role: {(session?.user as any)?.role || 'ADMIN'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-6">
                <h4 className="text-[15px] font-black mb-4 text-[#1E293B]">Change Email</h4>
                <div>
                  <label className={labelClass}>Current Email</label>
                  <input type="email" className={inputClass + ' bg-gray-100'} value={session?.user?.email || ''} disabled />
                </div>
                <div className="mt-4">
                  <label className={labelClass}>New Email</label>
                  <input type="email" className={inputClass} 
                    value={accForm.newEmail} 
                    onChange={e => setAccForm({...accForm, newEmail: e.target.value})}
                    placeholder="new@email.com" />
                </div>
              </div>

              <hr className="border-[#E2E8F0]" />

              <div>
                <h4 className="text-[15px] font-black mb-4 text-[#1E293B]">Change Password</h4>
                <div className="grid gap-4">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <input type="password" className={inputClass} 
                      value={accForm.currentPassword}
                      onChange={e => setAccForm({...accForm, currentPassword: e.target.value})}
                      placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" className={inputClass} 
                      value={accForm.newPassword}
                      onChange={e => setAccForm({...accForm, newPassword: e.target.value})}
                      placeholder="Min 6 characters" />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <input type="password" className={inputClass} 
                      value={accForm.confirmPassword}
                      onChange={e => setAccForm({...accForm, confirmPassword: e.target.value})}
                      placeholder="Re-enter new password" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className={`text-sm font-bold ${accountMsg.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>{accountMsg}</span>
                <button 
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-[12px] font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200 disabled:opacity-50" 
                  disabled={accSaving}
                  onClick={async () => {
                    setAccSaving(true);
                    setAccountMsg('');
                    try {
                      const res = await updateAccountAction(accForm);
                      if (res.success) {
                        setAccountMsg('✅ Account updated successfully. Please login again.');
                        setAccForm({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
                      } else {
                        setAccountMsg('❌ ' + (res.error || 'Failed'));
                      }
                    } catch(e: any) {
                      setAccountMsg('❌ ' + e.message);
                    } finally {
                      setAccSaving(false);
                    }
                  }}
                >
                  {accSaving ? <><i className="fas fa-spinner fa-spin"></i> Updating...</> : 'Update Account'}
                </button>
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
              <div className="pt-4 border-t border-[#E2E8F0]">
                <label className={labelClass}>CJ Dropshipping Fulfillment Payment Type</label>
                <select 
                  className={inputClass} 
                  value={draft.cjPayType ?? 3} 
                  onChange={e => setDraft({...draft, cjPayType: Number(e.target.value)})}
                >
                  <option value={3}>Type 3: Manual Payment (Create Unpaid Order on CJ - Recommended)</option>
                  <option value={2}>Type 2: Balance Payment (Auto-Deduct from CJ Wallet balance)</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-2 font-medium">
                  <strong>Type 3 (Manual Payment):</strong> Pesanan dibuat di akun CJ Anda tetapi belum dibayar (status Awaiting Payment). Anda harus masuk ke dashboard CJ Dropshipping untuk membayar secara manual dengan kartu kredit/debit, PayPal, dll.
                  <br className="mt-1" />
                  <strong>Type 2 (Balance Payment):</strong> Pesanan langsung dibayar otomatis memotong saldo Wallet akun CJ Anda. <em>Catatan: Memerlukan saldo wallet CJ yang cukup. Jika saldo kosong ($0), proses pengiriman order akan gagal/error.</em>
                </p>
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
