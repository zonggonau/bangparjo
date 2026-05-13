'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: 'Subscribed successfully!' });
        setEmail('');
      } else {
        setStatus({ type: 'error', msg: data.error || 'Failed to subscribe' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'System error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="email" 
            placeholder="Enter your email..." 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-primary hover:bg-primary-dark text-black px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 min-w-[100px]"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Join'}
        </button>
      </form>
      {status && (
        <div className={`mt-3 flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-1 ${
          status.type === 'success' ? 'text-green-400' : 'text-red-400'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {status.msg}
        </div>
      )}
    </div>
  );
}

