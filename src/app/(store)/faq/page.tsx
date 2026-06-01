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
            <div className="text-center py-10 bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
              <i className="fas fa-info-circle text-gray-300 text-4xl mb-4"></i>
              <p className="text-gray-400 font-medium">No FAQ content available yet. Please check back later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
