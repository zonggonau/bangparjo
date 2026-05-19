import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | bangparjo.shop',
};

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6">
            <i className="fas fa-shield-alt text-[#FF6B00]"></i>
            <span className="text-[#FF6B00] font-bold text-xs tracking-[0.2em] uppercase">Data Protection Protocol</span>
          </div>
          <h1 className="text-[48px] font-black text-[#1A1A1A] mb-4">Privacy <span className="text-[#FF6B00]">Policy</span></h1>
          <p className="text-gray-500">Last updated: May 16, 2026</p>
        </div>

        <div className="max-w-[800px] mx-auto pb-20 space-y-12">
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-database"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">1. Intelligence Collection</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">We extract and archive specific data strings provided directly during transaction initialization, newsletter synchronization, or support interface interactions. This includes your <strong>Identity Metadata</strong> (Name, Email), <strong>Terminal Destination</strong> (Shipping Address), and secure payment tokens.</p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-eye"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">2. Operational Usage</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">Collected intelligence is utilized exclusively for order execution, system communication regarding logistics status, and interface optimization. Marketing broadcasts are only initiated if your terminal has explicitly opted into the <strong>BangParjo Signal Array</strong>.</p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-share-alt"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">3. Network Sharing</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">Logistics data is transmitted to verified global nodes and carrier networks to facilitate physical payload delivery. We enforce strict non-disclosure protocols; your personal data strings are never liquidated or traded to third-party advertising conglomerates.</p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-lock"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">4. Security Layers</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">We deploy multiple cryptographic shield layers to safeguard your information. Sensitive financial data is processed via end-to-end encrypted tunnels and is <strong>Never Permanently Stored</strong> on our primary core servers.</p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-cookie-bite"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">5. Cookie Modules</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">Our interface utilizes cookie modules to maintain session persistence, preserve inventory in your virtual cart, and analyze global traffic patterns. These modules help us optimize the terminal experience for all verified users.</p>
          </section>

          <div className="text-center opacity-30">
            <p className="text-[10px] font-black tracking-[0.4em]">END OF TRANSMISSION</p>
          </div>
        </div>
      </div>
    </div>
  );
}
