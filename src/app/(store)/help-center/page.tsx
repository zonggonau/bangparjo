'use client';

import React from 'react';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

export default function HelpCenter() {
  const { settings } = useSettings();
  const whatsappLink = settings.socialLinks?.find(l => l.platform === 'whatsapp')?.url || `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '628219105980'}`;
  const whatsappNumber = whatsappLink.split('/').pop() || '';

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
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center w-16 h-16 rounded-[16px] bg-gray-50 mx-auto mb-6 text-2xl text-[#FF6B00]">
                <i className="fas fa-truck"></i>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Shipping & Delivery</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Track your global orders and view shipping policies.</p>
              <Link href="/track" className="text-[#FF6B00] font-bold text-sm no-underline">Track Order &rarr;</Link>
            </div>
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center w-16 h-16 rounded-[16px] bg-gray-50 mx-auto mb-6 text-2xl text-[#FF6B00]">
                <i className="fas fa-undo"></i>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Returns & Refunds</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Learn about our 30-day money-back guarantee.</p>
              <Link href="/returns" className="text-[#FF6B00] font-bold text-sm no-underline">Read Policy &rarr;</Link>
            </div>
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center w-16 h-16 rounded-[16px] bg-gray-50 mx-auto mb-6 text-2xl text-[#FF6B00]">
                <i className="fas fa-credit-card"></i>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Payments & Billing</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Accepted payment methods and currency conversions.</p>
              <Link href="/faq" className="text-[#FF6B00] font-bold text-sm no-underline">View Details &rarr;</Link>
            </div>
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center w-16 h-16 rounded-[16px] bg-gray-50 mx-auto mb-6 text-2xl text-[#FF6B00]">
                <i className="fas fa-question-circle"></i>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">General FAQs</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Answers to common questions about our store.</p>
              <Link href="/faq" className="text-[#FF6B00] font-bold text-sm no-underline">Browse FAQs &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Support Info Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-[800px] mx-auto px-5 text-center">
          <h2 className="text-[32px] font-black text-[#1A1A1A] mb-6">Contact Customer Support</h2>
          <p className="text-gray-500 mb-12">Our team is available to help with any questions you might have.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[24px] border border-gray-200">
              <i className="fab fa-whatsapp text-4xl text-[#25D366] mb-4"></i>
              <h4 className="font-bold text-[#1A1A1A] mb-2">WhatsApp</h4>
              <a 
                href={whatsappLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#25D366] font-bold no-underline"
              >
                {whatsappNumber.length > 10 ? `${whatsappNumber.slice(0, 4)}-${whatsappNumber.slice(4, 8)}-${whatsappNumber.slice(8)}` : whatsappNumber}
              </a>
            </div>
            <div className="bg-white p-8 rounded-[24px] border border-gray-200">
              <i className="fas fa-envelope text-4xl text-[#FF6B00] mb-4"></i>
              <h4 className="font-bold text-[#1A1A1A] mb-2">Email</h4>
              <p className="text-gray-600 font-bold m-0">{settings.adminEmail || 'support@bangparjo.shop'}</p>
            </div>
          </div>
          <p className="mt-8 text-gray-400 text-sm font-medium"><i className="fas fa-clock mr-2"></i> {settings.workingHours || 'Mon - Sat: 08:00 - 20:00 (GMT+7)'}</p>
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
