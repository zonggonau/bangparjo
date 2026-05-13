import { Eye, Database, Share2, Lock, Cookie, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | bangparjo.shop',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07070e] text-[#f0f0f6] py-24 md:py-32 selection:bg-primary selection:text-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.3em]">
             <ShieldCheck size={12} /> Data Protection Protocol
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
            Privacy <span className="text-glow">Policy</span>
          </h1>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Last synchronized: May 06, 2026</p>
        </div>

        <div className="space-y-16 relative">
          {/* Background Glow */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          
          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Database size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">1. Intelligence Collection</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">We extract and archive specific data strings provided directly during transaction initialization, newsletter synchronization, or support interface interactions. This includes your <span className="text-white italic font-bold">Identity Metadata</span> (Name, Email), <span className="text-white italic font-bold">Terminal Destination</span> (Shipping Address), and secure payment tokens.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Eye size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">2. Operational Usage</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">Collected intelligence is utilized exclusively for order execution, system communication regarding logistics status, and interface optimization. Marketing broadcasts are only initiated if your terminal has explicitly opted into the <span className="text-white font-bold italic underline decoration-primary/50">BangParjo Signal Array</span>.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Share2 size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">3. Network Sharing</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">Logistics data is transmitted to verified global nodes and carrier networks to facilitate physical payload delivery. We enforce strict non-disclosure protocols; your personal data strings are never liquidated or traded to third-party advertising conglomerates.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Lock size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">4. Security Layers</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">We deploy multiple cryptographic shield layers to safeguard your information. Sensitive financial data is processed via end-to-end encrypted tunnels and is <span className="text-red-500 font-black uppercase italic">Never Permanently Stored</span> on our primary core servers.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Cookie size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">5. Cookie Modules</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">Our interface utilizes cookie modules to maintain session persistence, preserve inventory in your virtual cart, and analyze global traffic patterns. These modules help us optimize the terminal experience for all verified users.</p>
          </section>
        </div>

        <div className="mt-32 pt-12 border-t border-white/5 text-center">
           <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">End of Transmission</p>
        </div>
      </div>
    </div>
  );
}

