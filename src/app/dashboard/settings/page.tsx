'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { 
  Store, 
  Truck, 
  TrendingUp, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  DollarSign,
  Info,
  ShieldCheck,
  Mail,
  Coins,
  Percent,
  ChevronRight,
  Package
} from 'lucide-react';

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
        setMessage('SUCCESS: System configuration updated.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('FAILURE: Storage operation rejected.');
      }
    } catch (err) {
      console.error(err);
      setMessage('ERROR: Critical system fault.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">Configuration Hub</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Fine-tuning local and global store parameters.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 border border-white/5 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 w-fit">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
        >
          <Store size={14} /> Store Profile
        </button>
        <button 
          onClick={() => setActiveTab('logistics')}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'logistics' ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
        >
          <Truck size={14} /> Logistics & Tax
        </button>
        <button 
          onClick={() => setActiveTab('margins')}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'margins' ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
        >
          <TrendingUp size={14} /> Profit Margin
        </button>
      </div>

      <div className="max-w-4xl space-y-12 pb-32">
        
        {/* TAB 1: Store Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
            <div className="px-12 py-10 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                <ShieldCheck size={20} className="text-primary" /> Store Credentials
              </h3>
            </div>
            <div className="p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                    <Package size={10} /> Brand Identity
                  </label>
                  <input 
                    type="text" 
                    value={draft.storeName || ''} 
                    onChange={e => setDraft({...draft, storeName: e.target.value})} 
                    placeholder="Enter Store Name"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                    <Mail size={10} /> Administrative Email
                  </label>
                  <input 
                    type="email" 
                    value={draft.adminEmail || ''} 
                    onChange={e => setDraft({...draft, adminEmail: e.target.value})} 
                    placeholder="admin@store.com"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                  <Coins size={10} /> Currency Nexus
                </label>
                <select 
                  value={draft.currencySymbol || 'USD'} 
                  onChange={e => setDraft({...draft, currencySymbol: e.target.value})} 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                >
                  {['USD', 'IDR', 'EUR', 'GBP'].map(c => <option key={c} value={c} className="bg-[#07070e]">{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Logistics & Tax */}
        {activeTab === 'logistics' && (
          <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
             <div className="px-12 py-10 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                <Truck size={20} className="text-primary" /> Supply Chain Logic
              </h3>
            </div>
            <div className="p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      Shipping Markup ({draft.currencySymbol})
                    </label>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic">Added on top of CJ freight rates.</p>
                  </div>
                  <input 
                    type="number" 
                    value={draft.shippingMarkup ?? 0} 
                    onChange={e => setDraft({...draft, shippingMarkup: Number(e.target.value)})} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      Free Ship Threshold ({draft.currencySymbol})
                    </label>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic">0 to disable free logistics.</p>
                  </div>
                  <input 
                    type="number" 
                    value={draft.freeShippingThreshold ?? 0} 
                    onChange={e => setDraft({...draft, freeShippingThreshold: Number(e.target.value)})} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      Global Tax Rate (%)
                    </label>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic">Applied during terminal checkout.</p>
                  </div>
                  <input 
                    type="number" 
                    value={draft.taxPct ?? 0} 
                    onChange={e => setDraft({...draft, taxPct: Number(e.target.value)})} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      CJ Settlement Mode
                    </label>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic">Fulfillment payment protocol.</p>
                  </div>
                  <select 
                    value={draft.cjPayType ?? 2} 
                    onChange={e => setDraft({...draft, cjPayType: Number(e.target.value)})} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                  >
                    <option value={2} className="bg-[#07070e]">AUTOMATIC: CJ BALANCE</option>
                    <option value={3} className="bg-[#07070e]">MANUAL: EXTERNAL SETTLEMENT</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Profit Margins */}
        {activeTab === 'margins' && (
          <div className="space-y-12">
            <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
              <div className="px-12 py-10 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <Percent size={20} className="text-primary" /> Base Margin Strategy
                </h3>
              </div>
              <div className="p-12">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-black/20 rounded-[2rem] border border-white/5">
                   <div className="space-y-1">
                     <label className="text-sm font-black text-white uppercase italic tracking-tight">Global Markup (%)</label>
                     <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] italic">Fallback profit margin for all assets.</p>
                   </div>
                   <div className="flex items-center gap-4">
                     <input 
                       type="number" 
                       value={draft.markupPct ?? 0} 
                       onChange={e => setDraft({...draft, markupPct: Number(e.target.value)})} 
                       className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-primary text-center focus:outline-none focus:border-primary transition-all" 
                     />
                     <span className="text-xl font-black text-white/10">%</span>
                   </div>
                 </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
              <div className="px-12 py-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <TrendingUp size={20} className="text-primary" /> Dynamic Tier Matrix
                </h3>
                <button 
                  onClick={() => setDraft({...draft, marginTiers: [...(draft.marginTiers || []), { min: 0, max: null, pct: 30 }]})} 
                  className="px-6 py-3 bg-white/5 border border-white/5 hover:border-primary/20 text-white hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Add Rule
                </button>
              </div>
              <div className="p-12 space-y-6">
                <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4 mb-8">
                  <Info size={18} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed italic">
                    Tiered rules are evaluated sequentially. The first matching cost-range will dictate the asset&apos;s retail markup.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {draft.marginTiers?.map((tier, idx) => (
                    <div key={idx} className="group flex flex-col md:flex-row md:items-center gap-6 p-8 bg-black/40 border border-white/5 rounded-[2rem] hover:border-primary/20 transition-all relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Base Cost:</span>
                          <div className="flex items-center gap-3 flex-1">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">$</span>
                              <input 
                                type="number" 
                                value={tier.min ?? 0} 
                                onChange={e => {
                                  const nt = [...(draft.marginTiers || [])];
                                  nt[idx].min = Number(e.target.value);
                                  setDraft({...draft, marginTiers: nt});
                                }} 
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-xs font-black text-white focus:outline-none focus:border-primary transition-all" 
                              />
                            </div>
                            <ChevronRight size={14} className="text-white/10" />
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">$</span>
                              <input 
                                type="number" 
                                value={tier.max === null ? '' : tier.max} 
                                placeholder="∞" 
                                onChange={e => {
                                  const nt = [...(draft.marginTiers || [])];
                                  nt[idx].max = e.target.value === '' ? null : Number(e.target.value);
                                  setDraft({...draft, marginTiers: nt});
                                }} 
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-xs font-black text-white placeholder:text-white/10 focus:outline-none focus:border-primary transition-all" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-8">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Markup:</span>
                            <div className="flex items-center gap-3 flex-1">
                              <input 
                                type="number" 
                                value={tier.pct ?? 0} 
                                onChange={e => {
                                  const nt = [...(draft.marginTiers || [])];
                                  nt[idx].pct = Number(e.target.value);
                                  setDraft({...draft, marginTiers: nt});
                                }} 
                                className="flex-1 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm font-black text-primary text-center focus:outline-none focus:border-primary transition-all" 
                              />
                              <span className="text-xs font-black text-primary">%</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setDraft({...draft, marginTiers: draft.marginTiers?.filter((_, i) => i !== idx)})} 
                            className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-black transition-all active:scale-95"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Sticky Save Bar */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-4xl z-50 animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 ring-1 ring-white/5">
            <div className="flex items-center gap-5 ml-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${message ? (message.includes('SUCCESS') ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500') : 'bg-white/5 text-white/20'}`}>
                {message ? (message.includes('SUCCESS') ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />) : <Save size={20} />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">System State</span>
                <p className={`text-[11px] font-black uppercase italic tracking-widest ${message ? (message.includes('SUCCESS') ? 'text-primary' : 'text-red-500') : 'text-white'}`}>
                  {message || 'Pending environmental updates'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full md:w-auto px-12 py-5 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Synchronizing...' : 'Commit Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

