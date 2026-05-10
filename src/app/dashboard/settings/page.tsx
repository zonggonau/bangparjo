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
        setMessage('✅ Konfigurasi berhasil disimpan');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Gagal menyimpan pengaturan');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ color: '#71717a', marginTop: '0.25rem', fontSize: '0.9rem' }}>Kelola konfigurasi toko dan kebijakan profit Anda.</p>
      </div>

      {/* Shadcn Style Tabs Switcher */}
      <div style={{ display: 'inline-flex', background: '#f4f4f5', padding: '0.25rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{ ...tabBtn, background: activeTab === 'profile' ? 'white' : 'transparent', color: activeTab === 'profile' ? '#09090b' : '#71717a', boxShadow: activeTab === 'profile' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
        >Store Profile</button>
        <button 
          onClick={() => setActiveTab('logistics')}
          style={{ ...tabBtn, background: activeTab === 'logistics' ? 'white' : 'transparent', color: activeTab === 'logistics' ? '#09090b' : '#71717a', boxShadow: activeTab === 'logistics' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
        >Logistics & Tax</button>
        <button 
          onClick={() => setActiveTab('margins')}
          style={{ ...tabBtn, background: activeTab === 'margins' ? 'white' : 'transparent', color: activeTab === 'margins' ? '#09090b' : '#71717a', boxShadow: activeTab === 'margins' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
        >Profit Margin</button>
      </div>

      <div style={{ maxWidth: '1000px', minHeight: '400px' }}>
        
        {/* TAB 1: Store Profile */}
        {activeTab === 'profile' && (
          <section style={sectionStyle}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={sectionTitle}>Store Information</h3>
              <p style={sectionSub}>Nama toko dan pengaturan mata uang global.</p>
            </div>
            <div style={cardStyle}>
              <div style={formRow}>
                <label style={labelStyle}>Store Name</label>
                <input type="text" value={draft.storeName} onChange={e => setDraft({...draft, storeName: e.target.value})} style={inputStyle} />
              </div>
              <div style={formRow}>
                <label style={labelStyle}>Contact Email</label>
                <input type="email" value={draft.adminEmail} onChange={e => setDraft({...draft, adminEmail: e.target.value})} style={inputStyle} />
              </div>
              <div style={formRow}>
                <label style={labelStyle}>Display Currency</label>
                <select value={draft.currencySymbol} onChange={e => setDraft({...draft, currencySymbol: e.target.value})} style={inputStyle}>
                  {['USD', 'IDR', 'EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: Logistics & Tax */}
        {activeTab === 'logistics' && (
          <section style={sectionStyle}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={sectionTitle}>Logistics & Tax</h3>
              <p style={sectionSub}>Konfigurasi biaya pengiriman tambahan dan pajak toko.</p>
            </div>
            <div style={cardStyle}>
              <div style={formRow}>
                <div>
                  <label style={labelStyle}>Shipping Markup ({draft.currencySymbol})</label>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Biaya tambahan pada tarif CJ</span>
                </div>
                <input type="number" value={draft.shippingMarkup} onChange={e => setDraft({...draft, shippingMarkup: Number(e.target.value)})} style={inputStyle} />
              </div>
              <div style={formRow}>
                <div>
                  <label style={labelStyle}>Free Shipping Over ({draft.currencySymbol})</label>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Ambang batas gratis ongkir</span>
                </div>
                <input type="number" value={draft.freeShippingThreshold} onChange={e => setDraft({...draft, freeShippingThreshold: Number(e.target.value)})} style={inputStyle} />
              </div>
              <div style={formRow}>
                <label style={labelStyle}>Default Tax Rate (%)</label>
                <input type="number" value={draft.taxPct} onChange={e => setDraft({...draft, taxPct: Number(e.target.value)})} style={inputStyle} />
              </div>
              <div style={formRow}>
                <div>
                  <label style={labelStyle}>CJ Payment Method</label>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Metode pembayaran ke pihak CJ</span>
                </div>
                <select value={draft.cjPayType} onChange={e => setDraft({...draft, cjPayType: Number(e.target.value)})} style={inputStyle}>
                  <option value={2}>Otomatis (Potong Saldo CJ)</option>
                  <option value={3}>Manual (Bayar di Dashboard CJ)</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: Profit Margins */}
        {activeTab === 'margins' && (
          <section style={sectionStyle}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={sectionTitle}>Profit Margins (Tiered Markup)</h3>
              <p style={sectionSub}>Markup otomatis berdasarkan harga modal produk dari CJ Dropshipping.</p>
            </div>
            <div style={{ ...cardStyle, gap: '1rem' }}>
              {draft.marginTiers?.map((tier, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fafafa', padding: '1rem', borderRadius: '8px', border: '1px solid #f4f4f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <span style={{ color: '#71717a', fontSize: '0.85rem' }}>$</span>
                    <input type="number" value={tier.min} onChange={e => {
                        const nt = [...(draft.marginTiers || [])];
                        nt[idx].min = Number(e.target.value);
                        setDraft({...draft, marginTiers: nt});
                      }} style={{ ...inputStyle, width: '100px' }} 
                    />
                    <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>to</span>
                    <span style={{ color: '#71717a', fontSize: '0.85rem' }}>$</span>
                    <input type="number" value={tier.max === null ? '' : tier.max} placeholder="Max" onChange={e => {
                        const nt = [...(draft.marginTiers || [])];
                        nt[idx].max = e.target.value === '' ? null : Number(e.target.value);
                        setDraft({...draft, marginTiers: nt});
                      }} style={{ ...inputStyle, width: '100px' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Markup</span>
                      <input type="number" value={tier.pct} onChange={e => {
                          const nt = [...(draft.marginTiers || [])];
                          nt[idx].pct = Number(e.target.value);
                          setDraft({...draft, marginTiers: nt});
                        }} style={{ ...inputStyle, width: '70px', color: '#16a34a', fontWeight: 700, textAlign: 'center' }} 
                      />
                      <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>%</span>
                    </div>
                    <button onClick={() => setDraft({...draft, marginTiers: draft.marginTiers?.filter((_, i) => i !== idx)})} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>×</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setDraft({...draft, marginTiers: [...(draft.marginTiers || []), { min: 0, max: null, pct: 30 }]})} style={{ padding: '0.75rem', background: 'transparent', border: '1px dashed #d1d5db', color: '#71717a', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>+ Add New Tier Rule</button>
            </div>
          </section>
        )}

        {/* Global Save Button - Sticky at bottom */}
        <div style={{ 
          marginTop: '2rem', padding: '1.5rem', background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', bottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div>
            {message && <span style={{ fontSize: '0.9rem', fontWeight: 600, color: message.includes('✅') ? '#16a34a' : '#ef4444' }}>{message}</span>}
            {!message && <span style={{ fontSize: '0.85rem', color: '#71717a' }}>Klik simpan untuk menerapkan semua perubahan di seluruh tab.</span>}
          </div>
          <button onClick={handleSave} disabled={saving} style={{
              padding: '0.6rem 1.5rem', background: '#18181b', color: 'white', border: 'none', borderRadius: '6px',
              fontWeight: 500, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer'
            }}>{saving ? 'Menyimpan...' : 'Save All Changes'}</button>
        </div>

      </div>
    </div>
  );
}

const tabBtn = { padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' };
const sectionStyle = { animation: 'fadeIn 0.2s ease-in-out' };
const sectionTitle = { fontSize: '1.1rem', fontWeight: 600, margin: 0 };
const sectionSub = { fontSize: '0.85rem', color: '#71717a', marginTop: '0.25rem' };
const cardStyle = { display: 'grid', gap: '1.25rem', padding: '1.5rem', border: '1px solid #e4e4e7', borderRadius: '8px', background: 'white' };
const formRow = { display: 'grid', gridTemplateColumns: '1fr 1.5fr', alignItems: 'center', gap: '1rem' };
const labelStyle = { fontSize: '0.875rem', fontWeight: 600, color: '#09090b' };
const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '0.875rem', outline: 'none', height: '38px' };
