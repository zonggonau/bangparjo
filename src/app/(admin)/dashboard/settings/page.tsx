'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { updateStoreSettingsAction } from '@/lib/actions';
import { getAdminWebhooksAction, saveAdminWebhookSettingsAction } from '@/lib/actions-admin-webhooks';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { settings: currentSettings, refreshSettings } = useSettings();
  const [draft, setDraft] = useState(currentSettings);
  const [activeTab, setActiveTab] = useState<'profile' | 'logistics' | 'margins' | 'webhooks' | 'pages' | 'account'>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [accountMsg, setAccountMsg] = useState('');
  const [accSaving, setAccSaving] = useState(false);
  const [accForm, setAccForm] = useState({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
  const { data: session } = useSession();
  const [webhookBaseUrl, setWebhookBaseUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState({
    product: true,
    stock: true,
    order: true,
    logistics: true
  });

  useEffect(() => {
    if (currentSettings) {
      const dbUrl = (currentSettings as any).CJ_WEBHOOK_URL || '';
      if (dbUrl) {
        setWebhookBaseUrl(dbUrl.replace(/\/api\/cj-webhook$/, ''));
      }
      const dbEvents = (currentSettings as any).CJ_WEBHOOK_EVENTS;
      if (Array.isArray(dbEvents)) {
        setWebhookEvents({
          product: dbEvents.includes('product'),
          stock: dbEvents.includes('stock'),
          order: dbEvents.includes('order'),
          logistics: dbEvents.includes('logistics'),
        });
      }
    }
  }, [currentSettings]);

  const handleRegisterWebhook = async () => {
    setSaving(true);
    setMessage('');
    try {
      const { registerCJWebhookAction } = await import('@/lib/actions-admin');
      const finalBaseUrl = webhookBaseUrl.trim() || window.location.origin;
      
      if (!finalBaseUrl.startsWith('https://') && !finalBaseUrl.includes('localhost') && !finalBaseUrl.includes('127.0.0.1')) {
        if (!finalBaseUrl.startsWith('http://')) {
          setMessage('❌ Webhook base URL must start with https://');
          setSaving(false);
          return;
        }
      }

      const res = await registerCJWebhookAction(finalBaseUrl, webhookEvents);
      if (res.success) {
        await refreshSettings();
        setMessage('✅ Webhook registered successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ Registration failed: ${res.message}`);
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ System error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

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
                <input type="text" className={inputClass} value={draft.storeName || ''} onChange={e => setDraft({...draft, storeName: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Administrative Email</label>
                <input type="email" className={inputClass} value={draft.adminEmail || ''} onChange={e => setDraft({...draft, adminEmail: e.target.value})} />
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
                <select className={inputClass} value={draft.currencySymbol || 'USD'} onChange={e => setDraft({...draft, currencySymbol: e.target.value})}>
                   <option value="USD">USD ($) — International</option>
                   <option value="IDR">IDR (Rp) — Indonesia</option>
                   <option value="EUR">EUR (€) — Europe</option>
                 </select>
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
                      const res = { success: false, error: 'Not implemented' };
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

              <div className="pt-6 border-t border-[#E2E8F0] mt-6">
                <h4 className="text-[15px] font-black mb-2 text-[#1E293B]">CJ Dropshipping Webhook Integration</h4>
                <p className="text-xs text-gray-500 mb-5">
                  Configure a secure public HTTPS callback URL to sync products, inventory updates, order status, and carrier tracking information in real-time.
                </p>

                <div className="bg-gray-50 p-6 rounded-[12px] border border-[#E2E8F0] space-y-5">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Webhook Status</span>
                    {(currentSettings as any)?.CJ_WEBHOOK_REGISTERED_AT ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                        <i className="fas fa-check-circle"></i> Active & Registered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        <i className="fas fa-exclamation-circle"></i> Unregistered
                      </span>
                    )}
                  </div>

                  {/* Registered Info */}
                  {(currentSettings as any)?.CJ_WEBHOOK_REGISTERED_AT && (
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-400">Registered Callback URL:</span>
                        <span className="font-mono text-gray-700 font-semibold">{(currentSettings as any).CJ_WEBHOOK_URL}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-400">Last Registration Date:</span>
                        <span className="text-gray-700 font-bold">
                          {new Date((currentSettings as any).CJ_WEBHOOK_REGISTERED_AT).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Base URL Input */}
                  <div>
                    <label className={labelClass}>Public Webhook Base URL</label>
                    <input
                      type="url"
                      className={inputClass}
                      value={webhookBaseUrl}
                      onChange={(e) => setWebhookBaseUrl(e.target.value)}
                      placeholder={typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}
                    />
                    <p className="text-[11px] text-gray-400 mt-2 font-medium">
                      Specify your public HTTPS URL (e.g. ngrok URL `https://abcdef.ngrok-free.app` during development or production store domain). Do not use localhost.
                    </p>
                  </div>

                  {/* Subscriptions */}
                  <div>
                    <label className={labelClass}>Event Subscriptions</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <label className="flex items-center gap-3 p-3 bg-white rounded-[8px] border border-[#E2E8F0] cursor-pointer hover:bg-gray-50 transition-all select-none">
                        <input
                          type="checkbox"
                          className="accent-[#FF6B00] w-4 h-4 rounded"
                          checked={webhookEvents.product}
                          onChange={(e) => setWebhookEvents({ ...webhookEvents, product: e.target.checked })}
                        />
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">Product Event Sync</p>
                          <p className="text-[10px] text-gray-400">Sync off-sale status and variations</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-[8px] border border-[#E2E8F0] cursor-pointer hover:bg-gray-50 transition-all select-none">
                        <input
                          type="checkbox"
                          className="accent-[#FF6B00] w-4 h-4 rounded"
                          checked={webhookEvents.stock}
                          onChange={(e) => setWebhookEvents({ ...webhookEvents, stock: e.target.checked })}
                        />
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">Stock Quantity Sync</p>
                          <p className="text-[10px] text-gray-400">Sync real-time warehouse inventory</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-[8px] border border-[#E2E8F0] cursor-pointer hover:bg-gray-50 transition-all select-none">
                        <input
                          type="checkbox"
                          className="accent-[#FF6B00] w-4 h-4 rounded"
                          checked={webhookEvents.order}
                          onChange={(e) => setWebhookEvents({ ...webhookEvents, order: e.target.checked })}
                        />
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">Order Fulfillment Sync</p>
                          <p className="text-[10px] text-gray-400">Sync dispatch & status updates</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-[8px] border border-[#E2E8F0] cursor-pointer hover:bg-gray-50 transition-all select-none">
                        <input
                          type="checkbox"
                          className="accent-[#FF6B00] w-4 h-4 rounded"
                          checked={webhookEvents.logistics}
                          onChange={(e) => setWebhookEvents({ ...webhookEvents, logistics: e.target.checked })}
                        />
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">Logistics Tracking Sync</p>
                          <p className="text-[10px] text-gray-400">Sync tracking numbers to customers</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      className="px-5 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-[8px] text-sm font-bold hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2"
                      disabled={saving}
                      onClick={handleRegisterWebhook}
                    >
                      {saving ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Registering...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plug"></i> Register CJ Webhook Callback
                        </>
                      )}
                    </button>
                  </div>
                </div>
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
