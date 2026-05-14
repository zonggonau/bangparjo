import { RefreshCcw, CheckCircle2, Send, Truck, AlertCircle, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy | bangparjo.shop',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#07070e] text-[#f0f0f6] py-24 md:py-32 selection:bg-primary selection:text-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.3em]">
             <ShieldAlert size={12} /> Asset Protection Protocol
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
            Refund <span className="text-glow">Policy</span>
          </h1>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Last synchronized: May 06, 2026</p>
        </div>

        <div className="space-y-16 relative">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
          
          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <RefreshCcw size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">1. Operational Window</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">Our resolution protocol remains active for a duration of <span className="text-white italic font-bold">30 solar days</span> post-delivery. Once this temporal window has elapsed, the transaction is considered finalized and immutable; no further refund or exchange sequences can be initiated.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">2. Eligibility Matrix</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400 leading-relaxed font-medium">To qualify for a reversal sequence, the physical asset must maintain its <span className="text-white italic font-bold">Original Integrity</span>—unused and secured within its primary logistics packaging. Valid trigger events include:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                <li className="flex items-center gap-2"><AlertCircle size={12} className="text-primary" /> Structural Damage</li>
                <li className="flex items-center gap-2"><AlertCircle size={12} className="text-primary" /> Logistics Deviation</li>
                <li className="flex items-center gap-2"><AlertCircle size={12} className="text-primary" /> Critical Non-Compliance</li>
                <li className="flex items-center gap-2"><AlertCircle size={12} className="text-primary" /> Misidentified Asset</li>
              </ul>
            </div>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Send size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">3. Initiation Sequence</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">To trigger a refund request, transmit your order identification and high-resolution visual evidence (photos/video) to <span className="text-white font-bold italic underline decoration-primary/50">support@bangparjo.shop</span>. Our compliance unit will audit the transmission and provide a status update on your request validation.</p>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 group hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Truck size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">4. Logistics Liabilities</h2>
            </div>
            <p className="text-gray-400 leading-relaxed font-medium">Terminal users assume full responsibility for return logistics overhead. Initial shipping fees are <span className="text-red-500 font-black uppercase italic underline decoration-red-500/30">Non-Reversible</span>. We recommend utilizing tracked logistics nodes to ensure verified delivery to our secondary processing terminal.</p>
          </section>
        </div>

        <div className="mt-32 pt-12 border-t border-white/5 text-center">
           <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">End of Transmission</p>
        </div>
      </div>
    </div>
  );
}

