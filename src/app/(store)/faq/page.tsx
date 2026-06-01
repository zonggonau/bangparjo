'use client';

import { useSettings } from '@/context/SettingsContext';

export default function FAQPage() {
  const { settings } = useSettings();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6">
            <i className="fas fa-question-circle text-[#FF6B00]"></i>
            <span className="text-[#FF6B00] font-bold text-xs tracking-[0.2em] uppercase">Help Center</span>
          </div>
          <h1 className="text-[48px] font-black text-[#1A1A1A] mb-4">Frequently Asked <span className="text-[#FF6B00]">Questions</span></h1>
          <p className="text-gray-500 max-w-[600px] mx-auto">Find answers to common questions about our products, shipping, and more.</p>
        </div>

        <div className="max-w-[800px] mx-auto pb-20">
          {settings.faqContent ? (
            <div 
              className="prose prose-orange max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: settings.faqContent }}
            />
          ) : (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <i className="fas fa-truck text-[#FF6B00] text-sm"></i> Shipping & Delivery
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-2">How long does shipping take at bangparjo.shop?</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      At bangparjo.shop, delivery times vary by destination and our optimized shipping methods:
                      <br />• <strong>USA/UK/Germany/France:</strong> 7-15 business days.
                      <br />• <strong>Canada/Australia:</strong> 10-20 business days.
                      <br />• <strong>Rest of World:</strong> 15-30 business days.
                      <br /><span className="text-[11px] mt-1 block italic">*Processing time is 1-3 business days before the tracking number is issued.</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-2">Why hasn't my tracking number updated?</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">It is normal for tracking numbers to show "Pending" or "In Transit" with no updates for 3-5 days when a package is moving between international sorting centers. If there is no update for more than 10 business days, please contact the bangparjo.shop support team.</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-2">Are there any customs duties?</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">bangparjo.shop ships orders via international postal services (DDU - Delivered Duty Unpaid). While most packages avoid customs fees due to their low declared value, any import duties or local taxes are the responsibility of the recipient.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <i className="fas fa-shopping-bag text-[#FF6B00] text-sm"></i> Orders & Payments
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-2">What payment methods does bangparjo.shop accept?</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and localized payment methods like Midtrans. All transactions on bangparjo.shop are securely encrypted.</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-2">Can I cancel my order?</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">Orders can be cancelled within 12 hours of placement. After this period, the order is processed for fulfillment. Please contact bangparjo.shop support immediately if you need assistance.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <i className="fas fa-shield-alt text-[#FF6B00] text-sm"></i> Customs & Duties
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-2">Will I have to pay customs duties?</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">Orders are shipped on a DDU (Delivered Duty Unpaid) basis. Depending on your country's regulations, you may be responsible for import duties and taxes upon arrival. We recommend checking with your local customs office for details.</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
