import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help Center — bangparjo.shop',
  description: 'Find answers, track your order, and contact our support team.',
};

export default function HelpCenter() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 py-[120px] text-center">
        <div className="max-w-[1400px] mx-auto px-5">
          <h1 className="text-[48px] font-black text-[#1A1A1A] m-0 mb-4 leading-tight">How can we help you today?</h1>
          <p className="text-gray-500 text-lg mb-10">Search for answers or browse our knowledge base.</p>
          <div className="max-w-[600px] mx-auto relative">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input 
              type="text" 
              placeholder="Search for tracking, returns, payments..." 
              className="w-full px-5 py-5 pl-[52px] rounded-[16px] border border-gray-200 outline-none text-base shadow-[0_4px_24px_rgba(0,0,0,0.05)]"
            />
          </div>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="py-20">
        <div className="max-w-[1400px] mx-auto px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 rounded-[16px] bg-gray-50 mx-auto mb-6 text-2xl text-[#FF6B00]">
                <i className="fas fa-truck"></i>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Shipping & Delivery</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Track your global orders and view shipping policies.</p>
              <Link href="/track" className="text-[#FF6B00] font-bold text-sm no-underline">Track Order &rarr;</Link>
            </div>
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 rounded-[16px] bg-gray-50 mx-auto mb-6 text-2xl text-[#FF6B00]">
                <i className="fas fa-undo"></i>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Returns & Refunds</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Learn about our 30-day money-back guarantee.</p>
              <Link href="/refund" className="text-[#FF6B00] font-bold text-sm no-underline">Read Policy &rarr;</Link>
            </div>
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 rounded-[16px] bg-gray-50 mx-auto mb-6 text-2xl text-[#FF6B00]">
                <i className="fas fa-credit-card"></i>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Payments & Billing</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Accepted payment methods and currency conversions.</p>
              <a href="#payments" className="text-[#FF6B00] font-bold text-sm no-underline">View Details &rarr;</a>
            </div>
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 rounded-[16px] bg-gray-50 mx-auto mb-6 text-2xl text-[#FF6B00]">
                <i className="fas fa-question-circle"></i>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">General FAQs</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Answers to common questions about our store.</p>
              <a href="#faqs" className="text-[#FF6B00] font-bold text-sm no-underline">Browse FAQs &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="bg-gray-50 py-20" id="faqs">
        <div className="max-w-[800px] mx-auto px-5">
          <h2 className="text-[32px] font-black text-[#1A1A1A] text-center mb-12">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-4">
            
            <details className="bg-white rounded-[16px] overflow-hidden border border-gray-200">
              <summary className="p-5 cursor-pointer font-bold flex justify-between items-center list-none text-[#1A1A1A]">
                How long does shipping take?
                <i className="fas fa-plus text-xs opacity-50"></i>
              </summary>
              <div className="px-5 pb-5 text-gray-500 leading-relaxed text-sm">
                <p>Since we source products globally, shipping times vary depending on your location and the supplier's location. Typically, deliveries take between 7 to 15 business days. You can track your order using your tracking number.</p>
              </div>
            </details>

            <details className="bg-white rounded-[16px] overflow-hidden border border-gray-200">
              <summary className="p-5 cursor-pointer font-bold flex justify-between items-center list-none text-[#1A1A1A]">
                Do you ship internationally?
                <i className="fas fa-plus text-xs opacity-50"></i>
              </summary>
              <div className="px-5 pb-5 text-gray-500 leading-relaxed text-sm">
                <p>Yes! We offer worldwide shipping to most countries. Shipping fees and delivery times will be calculated at checkout based on your delivery address.</p>
              </div>
            </details>

            <details className="bg-white rounded-[16px] overflow-hidden border border-gray-200">
              <summary className="p-5 cursor-pointer font-bold flex justify-between items-center list-none text-[#1A1A1A]">
                What is your return policy?
                <i className="fas fa-plus text-xs opacity-50"></i>
              </summary>
              <div className="px-5 pb-5 text-gray-500 leading-relaxed text-sm">
                <p>We offer a 30-day return policy for most items. If you are not satisfied with your purchase, please contact our support team within 30 days of receiving the item to initiate a return or exchange.</p>
              </div>
            </details>

            <details className="bg-white rounded-[16px] overflow-hidden border border-gray-200">
              <summary className="p-5 cursor-pointer font-bold flex justify-between items-center list-none text-[#1A1A1A]">
                How can I contact customer support?
                <i className="fas fa-plus text-xs opacity-50"></i>
              </summary>
              <div className="px-5 pb-5 text-gray-500 leading-relaxed text-sm">
                <p>You can reach out to us via:</p>
                <ul className="mt-2 leading-relaxed">
                  <li><strong>WhatsApp:</strong> <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '628219105980'}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-bold no-underline">{(() => { const wa = process.env.NEXT_PUBLIC_WHATSAPP || '628219105980'; return `${wa.slice(2,6)}-${wa.slice(6,10)}-${wa.slice(10)}`; })()}</a></li>
                  <li><strong>Email:</strong> support@bangparjo.shop</li>
                  <li><strong>AI Chat:</strong> Bottom right corner of the screen</li>
                </ul>
                <p className="mt-2">We aim to respond to all inquiries within 24 hours.</p>
              </div>
            </details>

          </div>
        </div>
      </section>

      {/* Contact Banner */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-5">
          <div className="bg-[#FF6B00] text-white rounded-[48px] p-16 text-center">
            <h2 className="text-[32px] font-black mb-4">Still need help?</h2>
            <p className="opacity-80 text-lg max-w-[500px] mx-auto mb-8">Our support team is always ready to assist you with any questions or concerns.</p>
            <Link href="/contact" className="inline-flex items-center justify-center px-10 py-4 text-base rounded-[16px] font-bold bg-white text-[#FF6B00] hover:bg-gray-100 transition-all duration-200">Contact Support</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
