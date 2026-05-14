import { Shield, FileText, Scale, Globe, CreditCard, Truck } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | bangparjo.shop',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07070e] text-[#f0f0f6] py-24 md:py-32 selection:bg-primary selection:text-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.3em]">
             <Shield size={12} /> Compliance Protocol
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
            Terms of <span className="text-glow">Service</span>
          </h1>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Last synchronized: May 06, 2026</p>
        </div>

        <div className="space-y-16 relative">
          {/* Background Glow */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          
          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">1. Acceptance of Terms</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">By accessing and using <span className="text-white italic font-bold">bangparjo.shop</span>, you accept and agree to be bound by the terms and provisions of this agreement. Our platform operates as a specialized digital interface for global commerce logistics.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">2. Description of Service</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium"><span className="text-white italic font-bold">bangparjo.shop</span> is an exclusive e-commerce platform providing access to curated global products. We facilitate high-performance logistics and order fulfillment directly from verified international nodes to your terminal destination.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">3. Pricing & Assets</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">All financial values are denominated in <span className="text-white font-bold italic underline decoration-primary/50">USD</span>. We maintain the right to adjust asset valuations in real-time. Payments are executed via authorized cryptographic or fiat processors (PayPal, Stripe, Midtrans) ensuring end-to-end security.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Truck size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">4. Global Logistics</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">Logistics timeframes are algorithmic estimates and not absolute guarantees. We are not liable for delays triggered by customs authority, geo-spatial disruptions, or carrier failure. Operational duties or local terminal taxes remain the sole responsibility of the recipient.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Scale size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">5. Intellectual Integrity</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">All visual assets, proprietary code, and textual intelligence on this terminal are the exclusive property of <span className="text-white italic font-bold">bangparjo.shop</span>. Any unauthorized reproduction or data mining is strictly prohibited under international copyright protocols.</p>
          </section>
        </div>

        <div className="mt-32 pt-12 border-t border-white/5 text-center">
           <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">End of Transmission</p>
        </div>
      </div>
    </div>
  );
}

