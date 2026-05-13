'use client';

import { useState } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Phone,
  Globe
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Order Issue',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus({ type: 'success', msg: 'Transmission successful. Our support nodes will respond shortly.' });
        setFormData({ name: '', email: '', subject: 'Order Issue', message: '' });
      } else {
        setStatus({ type: 'error', msg: 'Transmission failure. Please re-synchronize and try again.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Critical system error detected.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070e] text-[#f0f0f6] py-24 md:py-32 selection:bg-primary selection:text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.3em]">
             <HelpCircle size={12} /> Support Terminal
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
            Contact <span className="text-glow">Center</span>
          </h1>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Integrated help desk for global operations.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Info Side */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-6">Support Infrastructure</h3>
              <p className="text-gray-400 leading-relaxed font-medium mb-12">Our operational core is active 24/7. Use the form to initiate a secure transmission with our support nodes.</p>
              
              <div className="space-y-6">
                <ContactItem icon={Mail} label="Operational Email" value="support@bangparjo.shop" />
                <ContactItem icon={MessageSquare} label="WhatsApp Link" value="+62 812-3456-7890" />
                <ContactItem icon={Clock} label="Active Hours" value="Mon - Fri: 09:00 - 18:00 WIB" />
                <ContactItem icon={Globe} label="Global Coverage" value="Standard Logistics Response: < 24h" />
              </div>
            </div>

            <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2rem] flex items-center gap-6 group hover:bg-primary/10 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Encrypted Tunnel</h4>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">All transmissions are secured via end-to-end SSL encryption protocol.</p>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <form className="lg:col-span-7 bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4">Identifier Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="Your Identity"
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4">Terminal Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="example@core.com"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4">Logic Subject</label>
              <select 
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white appearance-none focus:outline-none focus:border-primary/50 transition-all"
              >
                <option value="Order Issue">Logistics Conflict</option>
                <option value="Payment Question">Financial Inquiry</option>
                <option value="Product Inquiry">Asset Specification</option>
                <option value="Shipping Delay">Transit Latency</option>
                <option value="Other">Custom Request</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4">Transmission Payload</label>
              <textarea 
                rows={5} 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-all resize-none"
                placeholder="Details of your request..."
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-5 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full animate-spin" />
              ) : (
                <>Transmit Sequence <Send size={16} /></>
              )}
            </button>

            {status && (
              <div className={`p-6 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500 ${
                status.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Status Update</h5>
                  <p className="text-xs font-bold uppercase tracking-tight">{status.msg}</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-5 group/item">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover/item:text-primary group-hover/item:border-primary/20 transition-all duration-300">
        <Icon size={20} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-white uppercase italic tracking-tight">{value}</span>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

