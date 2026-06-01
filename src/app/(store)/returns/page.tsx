'use client';

import { useSettings } from '@/context/SettingsContext';

export default function ReturnsPage() {
  const { settings } = useSettings();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6">
            <i className="fas fa-undo-alt text-[#FF6B00]"></i>
            <span className="text-[#FF6B00] font-bold text-xs tracking-[0.2em] uppercase">Money-back Guarantee</span>
          </div>
          <h1 className="text-[48px] font-black text-[#1A1A1A] mb-4">Refund & <span className="text-[#FF6B00]">Return Policy</span></h1>
          <p className="text-gray-500 max-w-[600px] mx-auto">Learn about our returns process and how we handle refunds.</p>
        </div>

        <div className="max-w-[800px] mx-auto pb-20">
          {settings.returnsContent ? (
            <div 
              className="prose prose-orange max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: settings.returnsContent }}
            />
          ) : (
            <div className="space-y-10">
              <section>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle text-[#FF6B00] text-sm"></i> bangparjo.shop Dispute Policy
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  At bangparjo.shop, we follow a strict quality-first policy via our global fulfillment partners. You are eligible for a <strong>Full Refund or Resend</strong> if:
                </p>
                <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5 mb-4">
                  <li><strong>Damaged Items:</strong> You must provide clear photos and/or videos of the damaged product and the shipping label to bangparjo.shop support within 5 days of delivery.</li>
                  <li><strong>Incorrect/Missing Items:</strong> If the item received is different from what was ordered on bangparjo.shop, or if items are missing.</li>
                  <li><strong>Electronic Products:</strong> Issues must be reported to bangparjo.shop within 10 days of delivery with video evidence.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <i className="fas fa-hourglass-half text-[#FF6B00] text-sm"></i> Shipping Timeouts
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  At bangparjo.shop, an order is considered "Timed Out" and eligible for a full refund if it has not arrived within:
                  <br />• <strong>USA:</strong> 45 days after dispatch.
                  <br />• <strong>International:</strong> 60 days after dispatch.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <i className="fas fa-undo text-[#FF6B00] text-sm"></i> Non-Eligible Returns
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Due to the nature of international dropshipping, bangparjo.shop <strong>cannot</strong> accept returns or provide refunds for:
                </p>
                <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5 mb-4">
                  <li>Customer ordered the wrong size/color/model.</li>
                  <li>Customer changed their mind or "didn't like" the product.</li>
                  <li>Incorrect shipping address provided during checkout on bangparjo.shop.</li>
                  <li>Tracking shows "Delivered" but the customer claims they didn't receive it.</li>
                </ul>
              </section>

              <div className="bg-orange-50 p-8 rounded-2xl border border-orange-100 mt-10">
                <h4 className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-2">
                  <i className="fas fa-envelope text-[#FF6B00]"></i> Submit a Dispute
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">To open a dispute with bangparjo.shop, please send your order number and photo/video evidence to:</p>
                <p className="font-bold text-[#FF6B00]">Email: {settings.adminEmail || 'support@bangparjo.com'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
