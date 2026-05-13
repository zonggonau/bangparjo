'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSubscribed(true);
        setEmail('');
      } else {
        setError(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-light/5 blur-[120px] rounded-full -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="container px-4">
        <div className="bg-white/5 border border-white/5 rounded-[3rem] p-8 md:p-16 backdrop-blur-2xl relative overflow-hidden group shadow-2xl">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-8">
                <Mail size={12} /> Newsletter
              </span>
              
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 uppercase italic leading-[0.9]">
                JOIN THE <span className="text-primary text-glow">INSIDER</span> CLUB
              </h2>
              
              <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8 font-medium">
                Subscribe for <span className="text-white font-black underline decoration-primary decoration-2 underline-offset-4">10% OFF</span> your first order. Get exclusive access to limited arrivals, secret sales, and global trending insights.
              </p>

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Spam-Free Guarantee</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Instant Discount</span>
                </div>
              </div>
            </div>

            <div className="relative">
              {subscribed ? (
                <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-10 text-center animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-black mx-auto mb-6 shadow-lg shadow-primary/20">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">YOU&apos;RE IN!</h3>
                  <p className="text-gray-400 text-sm font-medium">Check your inbox for your 10% discount code.</p>
                </div>
              ) : (
                <div className="bg-black/40 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={20} />
                      <input 
                        type="email" 
                        placeholder="your@email.com" 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white placeholder:text-white/10 focus:border-primary outline-none transition-all text-sm font-medium"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="group w-full flex items-center justify-center gap-3 bg-white text-black px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-primary transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          Subscribe Now <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
                        </>
                      )}
                    </button>

                    {error && (
                      <p className="text-xs font-bold text-red-500/80 text-center uppercase tracking-tight animate-shake">
                        ⚠️ {error}
                      </p>
                    )}

                    <p className="text-[10px] text-white/20 text-center leading-loose font-bold uppercase tracking-widest pt-4">
                      By joining, you agree to our <a href="#" className="text-white/40 hover:text-primary underline">Privacy Policy</a> and <a href="#" className="text-white/40 hover:text-primary underline">Terms of Service</a>.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

