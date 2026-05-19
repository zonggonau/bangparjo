import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy | bangparjo.shop',
};

export default function RefundPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6">
            <i className="fas fa-undo-alt text-[#FF6B00]"></i>
            <span className="text-[#FF6B00] font-bold text-xs tracking-[0.2em] uppercase">Money-back Guarantee</span>
          </div>
          <h1 className="text-[48px] font-black text-[#1A1A1A] mb-4">Refund & <span className="text-[#FF6B00]">Return Policy</span></h1>
          <p className="text-gray-500 max-w-[600px] mx-auto">Last updated: May 16, 2026</p>
        </div>

        <div className="max-w-[800px] mx-auto pb-20">
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">1. 30-Day Satisfaction Guarantee</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">We stand behind the quality of our products. If you are not completely satisfied with your purchase, you may request a return within <strong>30 days</strong> of receiving your order. We will provide a full refund or exchange for items that meet our return criteria.</p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">2. Eligibility Requirements</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">To be eligible for a return, your item must be:</p>
            <ul className="text-gray-500 leading-relaxed mt-2 space-y-2">
              <li><i className="fas fa-check text-green-500 mr-2"></i>Unused and in the same condition that you received it</li>
              <li><i className="fas fa-check text-green-500 mr-2"></i>In the original packaging (if applicable)</li>
              <li><i className="fas fa-check text-green-500 mr-2"></i>Accompanied by proof of purchase (order number)</li>
              <li><i className="fas fa-check text-green-500 mr-2"></i>Requested within 30 days of delivery</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">3. Non-Returnable Items</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">The following items cannot be returned:</p>
            <ul className="text-gray-500 leading-relaxed mt-2 space-y-2">
              <li><i className="fas fa-times text-red-500 mr-2"></i>Gift cards or store credits</li>
              <li><i className="fas fa-times text-red-500 mr-2"></i>Downloadable software or digital products</li>
              <li><i className="fas fa-times text-red-500 mr-2"></i>Personal care items (e.g., makeup, skincare) that have been opened</li>
              <li><i className="fas fa-times text-red-500 mr-2"></i>Items marked as "Final Sale" or "Clearance"</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-truck"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">4. Return Shipping</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">Customers are responsible for return shipping costs unless the item is defective or we made an error with your order. We recommend using a trackable shipping service for returns, as we cannot guarantee receipt of returned items.</p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-clock"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">5. Refund Processing Time</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">Once we receive your returned item, we will inspect it and notify you of the approval or rejection of your refund. If approved, your refund will be processed within <strong>5-7 business days</strong> and automatically applied to your original payment method.</p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-question-circle"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">6. How to Initiate a Return</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">To start a return, please contact our support team:</p>
            <div className="mt-4 flex gap-4 flex-wrap">
              <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '628219105980'}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold bg-[#25D366] text-white hover:bg-[#1DAF56] transition-all duration-200">
                <i className="fab fa-whatsapp"></i> WhatsApp Support
              </a>
              <a href="mailto:support@bangparjo.shop" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200">
                <i className="fas fa-envelope"></i> Email Support
              </a>
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold border border-gray-200 text-[#1A1A1A] hover:bg-gray-50 transition-all duration-200">
                <i className="fas fa-paper-plane"></i> Contact Form
              </Link>
            </div>
          </section>

          <div className="text-center mt-16 opacity-30">
            <p className="text-[10px] font-black tracking-[0.4em]">END OF POLICY</p>
          </div>
        </div>
      </div>
    </div>
  );
}
