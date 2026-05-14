'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

type TabType = 'profile' | 'logistics' | 'margins' | 'social';

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

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ color: '#71717a', marginTop: '0.25rem', fontSize: '0.9rem' }}>Manage your store configuration and profit policies.</p>
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
              <p style={sectionSub}>Store name and global currency settings.</p>
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
              <p style={sectionSub}>Configure additional shipping fees and store taxes.</p>
            </div>
            <div style={cardStyle}>
              <div style={formRow}>
                <div>
                  <label style={labelStyle}>Shipping Markup ({draft.currencySymbol})</label>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Extra fee on top of carrier rates</span>
                </div>
                <input type="number" value={draft.shippingMarkup} onChange={e => setDraft({...draft, shippingMarkup: Number(e.target.value)})} style={inputStyle} />
              </div>
              <div style={formRow}>
                <div>
                  <label style={labelStyle}>Free Shipping Over ({draft.currencySymbol})</label>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Threshold for free shipping</span>
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
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>How to pay the global supplier (CJ)</span>
                </div>
                <select value={draft.cjPayType} onChange={e => setDraft({...draft, cjPayType: Number(e.target.value)})} style={inputStyle}>
                  <option value={2}>Automatic (Deduct from CJ Balance)</option>
                  <option value={3}>Manual (Pay in CJ Dashboard)</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: Follow Us / Social Media */}
        {activeTab === 'social' && (
          <section style={sectionStyle}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={sectionTitle}>Follow Us — Social Media Links</h3>
              <p style={sectionSub}>These links appear in the footer of your store. Add or edit your social media profiles below.</p>
            </div>
            <div style={{ ...cardStyle, gap: '0.875rem' }}>
              {(draft.socialLinks || []).map((link, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fafafa', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid #f4f4f5' }}>
                  <span style={{ fontSize: '1.5rem' }}>{link.icon}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <input 
                      type="text" value={link.platform} placeholder="Platform" 
                      onChange={e => {
                        const arr = [...(draft.socialLinks || [])];
                        arr[idx] = { ...arr[idx], platform: e.target.value };
                        setDraft({...draft, socialLinks: arr});
                      }}
                      style={{ ...inputStyle, height: '32px', fontSize: '0.8rem', width: '140px' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" value={link.label} placeholder="Label (e.g. Instagram)" 
                        onChange={e => {
                          const arr = [...(draft.socialLinks || [])];
                          arr[idx] = { ...arr[idx], label: e.target.value };
                          setDraft({...draft, socialLinks: arr});
                        }}
                        style={{ ...inputStyle, height: '32px', fontSize: '0.8rem', flex: 1 }}
                      />
                      <select 
                        value={link.icon} 
                        onChange={e => {
                          const arr = [...(draft.socialLinks || [])];
                          arr[idx] = { ...arr[idx], icon: e.target.value };
                          setDraft({...draft, socialLinks: arr});
                        }}
                        style={{ ...inputStyle, height: '32px', fontSize: '0.8rem', width: '70px' }}
                      >
                        <option value="📘">📘 FB</option>
                        <option value="📸">📸 IG</option>
                        <option value="🎵">🎵 TT</option>
                        <option value="💬">💬 WA</option>
                        <option value="▶️">▶️ YT</option>
                        <option value="🐦">🐦 X</option>
                        <option value="💼">💼 LI</option>
                        <option value="📌">📌 Pin</option>
                        <option value="🌐">🌐 Web</option>
                      </select>
                    </div>
                    <input 
                      type="url" value={link.url} placeholder="https://..." 
                      onChange={e => {
                        const arr = [...(draft.socialLinks || [])];
                        arr[idx] = { ...arr[idx], url: e.target.value };
                        setDraft({...draft, socialLinks: arr});
                      }}
                      style={{ ...inputStyle, height: '32px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <button 
                    onClick={() => setDraft({...draft, socialLinks: draft.socialLinks?.filter((_, i) => i !== idx)})}
                    style={{ background: '#fef2f2', border: 'none', color: '#ef4444', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}
                  >×</button>
                </div>
              ))}
              <button 
                onClick={() => setDraft({...draft, socialLinks: [...(draft.socialLinks || []), { platform: '', label: '', url: '', icon: '🌐' }]})}
                style={{ padding: '0.75rem', background: 'transparent', border: '1px dashed #d1d5db', color: '#71717a', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              >+ Add Social Link</button>
            </div>
          </section>
        )}

        {/* TAB 3: Profit Margins */}
        {activeTab === 'margins' && (
          <section style={sectionStyle}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={sectionTitle}>Profit Margins (Tiered Markup)</h3>
              <p style={sectionSub}>Automatic markup based on product base cost from global suppliers.</p>
            </div>
            
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
               <div style={formRow}>
                <div>
                  <label style={labelStyle}>Default Flat Margin (%)</label>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Fallback margin if no tiers match</span>
                </div>
                <input type="number" value={draft.markupPct} onChange={e => setDraft({...draft, markupPct: Number(e.target.value)})} style={inputStyle} />
              </div>
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
            {!message && <span style={{ fontSize: '0.85rem', color: '#71717a' }}>Click save to apply all changes across all tabs.</span>}
          </div>
          <button onClick={handleSave} disabled={saving} style={{
              padding: '0.6rem 1.5rem', background: '#18181b', color: 'white', border: 'none', borderRadius: '6px',
              fontWeight: 500, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer'
            }}>{saving ? 'Saving...' : 'Save All Changes'}</button>
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
