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
            <span className="text-[#FF6B00] font-bold text-xs tracking-[0.2em] uppercase">Terms & Conditions</span>
          </div>
          <h1 className="text-[48px] font-black text-[#1A1A1A] mb-4">
            Terms of <span className="text-[#FF6B00]">Service</span>
          </h1>
          <p className="text-gray-500">Last updated: June 9, 2026</p>
        </div>

        <div className="max-w-[800px] mx-auto pb-20 space-y-12">
          {/* 1. Account */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-user-circle"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">1. Account & Registration</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              By registering on bangparjo.shop, you agree to these terms. You are fully responsible for your account security and all activities under it. All information you provide must be true, accurate, and complete.
            </p>
          </section>

          {/* 2. Services */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-box"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">2. Dropshipping Services</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              We provide product sourcing, order processing, and direct shipping to your customers. Products are sourced from third-party suppliers. Prices, stock, and shipping estimates may change at any time. You are responsible for your own pricing and customer satisfaction.
            </p>
          </section>

          {/* 3. Orders */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-shopping-cart"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">3. Orders & Payment</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Orders are processed after payment is received. You must verify all order details (product, address, quantity) before confirmation. We are not liable for errors caused by incorrect information you provide. Payments are processed through available methods on the platform.
            </p>
          </section>

          {/* 4. Shipping */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-truck"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">4. Shipping & Logistics</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Shipping estimates are indicative and not guaranteed. Delays caused by customs, weather, or force majeure are beyond our control. Actual shipping costs may differ from initial estimates. You are responsible for import duties and customs fees in the destination country.
            </p>
          </section>

          {/* 5. Returns */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-undo-alt"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">5. Returns & Refunds</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Claims for damaged or incorrect products must be reported within 7 days of receipt with photo/video evidence. Refunds are processed according to the platform's dispute resolution policy. Personalized products (POD/custom packaging) are non-returnable unless there is a manufacturing defect.
            </p>
          </section>

          {/* 6. Prohibited */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-ban"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">6. Prohibited Conduct</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              You may not use the platform for illegal activities, fraud, intellectual property infringement, spam, or system abuse. Violations may result in account suspension or termination without notice.
            </p>
          </section>

          {/* 7. Liability */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">7. Limitation of Liability</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              We are not liable for indirect damages, loss of profits, or reputational harm arising from the use of our services. Services are provided "as is" without any express or implied warranties. Our maximum liability is limited to the order value you paid.
            </p>
          </section>

          {/* 8. Changes */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-edit"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">8. Changes to Terms</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              We may update these terms at any time. Changes will be announced via email or platform notification. Continued use after changes means you accept the updated terms.
            </p>
          </section>

          {/* 9. Governing Law */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-gavel"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">9. Governing Law</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              These terms are governed by the laws of Indonesia. Any disputes will first be resolved through mutual discussion. If no agreement is reached, disputes will be settled in the competent courts of Indonesia.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-gray-50 text-[#FF6B00]">
                <i className="fas fa-envelope"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] m-0">10. Contact Us</h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              If you have any questions about these terms, contact us at <strong>bangparjoshop@gmail.com</strong> or through our website's contact page.
            </p>
          </section>

          <div className="text-center opacity-30 pt-10 border-t">
            <p className="text-[10px] font-black tracking-[0.4em]">END OF TERMS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
