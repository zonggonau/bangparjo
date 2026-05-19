import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | bangparjo.shop',
};

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6">
            <i className="fas fa-file-contract text-[#FF6B00]"></i>
            <span className="text-[#FF6B00] font-bold text-xs tracking-[0.2em] uppercase">Compliance Protocol</span>
          </div>
          <h1 className="text-[48px] font-black text-[#1A1A1A] mb-4">Terms of <span className="text-[#FF6B00]">Service</span></h1>
          <p className="text-gray-500">Last updated: May 16, 2026</p>
        </div>

        <div className="max-w-[800px] mx-auto pb-20 space-y-12">
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-file-alt"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">1. Acceptance of Terms</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">By accessing and using <strong>bangparjo.shop</strong>, you accept and agree to be bound by the terms and provisions of this agreement. Our platform operates as a specialized digital interface for global commerce logistics.</p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-globe"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">2. Description of Service</h2>
            </div>
            <p className="text-gray-500 leading-relaxed"><strong>bangparjo.shop</strong> is an exclusive e-commerce platform providing access to curated global products. We facilitate high-performance logistics and order fulfillment directly from verified international nodes to your terminal destination.</p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-credit-card"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">3. Pricing & Assets</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">All financial values are denominated in <strong>USD</strong>. We maintain the right to adjust asset valuations in real-time. Payments are executed via authorized cryptographic or fiat processors (PayPal, Stripe, Midtrans) ensuring end-to-end security.</p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-truck"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">4. Global Logistics</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">Logistics timeframes are algorithmic estimates and not absolute guarantees. We are not liable for delays triggered by customs authority, geo-spatial disruptions, or carrier failure. Operational duties or local terminal taxes remain the sole responsibility of the recipient.</p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-balance-scale"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">5. Intellectual Integrity</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">All visual assets, proprietary code, and textual intelligence on this terminal are the exclusive property of <strong>bangparjo.shop</strong>. Any unauthorized reproduction or data mining is strictly prohibited under international copyright protocols.</p>
          </section>

          <div className="text-center opacity-30">
            <p className="text-[10px] font-black tracking-[0.4em]">END OF TRANSMISSION</p>
          </div>
        </div>
      </div>
    </div>
  );
}
