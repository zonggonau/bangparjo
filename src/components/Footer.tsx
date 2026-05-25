'use client';

import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';
import { useEffect, useState } from 'react';

export default function Footer() {
  const { settings } = useSettings();
  const [year, setYear] = useState('2026');

  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);
  
  return (
    <footer className="bg-[#FAFAFA] border-t border-[#E5E5E5] pt-16 pb-0">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-[#E5E5E5]">
          <div>
            <Link href="/" className="text-[22px] sm:text-[28px] font-extrabold text-[#1A1A1A] tracking-[-1px] shrink-0 inline-block mb-4">
              {settings.storeName.split('.')[0]}<span className="text-[#FF6B00]">{settings.storeName.split('.').slice(1).join('.') || 'Shop'}</span>
            </Link>
            <p className="text-[14px] text-[#888888] leading-[1.7] max-w-[320px]">Global dropshipping marketplace connecting suppliers with entrepreneurs worldwide. Quality products, best prices, reliable shipping.</p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#555555] text-lg transition-all duration-300 hover:bg-[#FF6B00] hover:text-white"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#555555] text-lg transition-all duration-300 hover:bg-[#FF6B00] hover:text-white"><i className="fab fa-instagram"></i></a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#555555] text-lg transition-all duration-300 hover:bg-[#FF6B00] hover:text-white"><i className="fab fa-twitter"></i></a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#555555] text-lg transition-all duration-300 hover:bg-[#FF6B00] hover:text-white"><i className="fab fa-youtube"></i></a>
            </div>
          </div>
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-5 text-[#1A1A1A]">Menu</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-[14px] text-[#888888] transition-all duration-300 hover:text-[#FF6B00]">Home</Link></li>
              <li><Link href="/#products" className="text-[14px] text-[#888888] transition-all duration-300 hover:text-[#FF6B00]">Products</Link></li>
              <li><Link href="/track" className="text-[14px] text-[#888888] transition-all duration-300 hover:text-[#FF6B00]">Track Order</Link></li>
              <li><Link href="/contact" className="text-[14px] text-[#888888] transition-all duration-300 hover:text-[#FF6B00]">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-5 text-[#1A1A1A]">Help</h4>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-[14px] text-[#888888] transition-all duration-300 hover:text-[#FF6B00]">FAQ</Link></li>
              <li><Link href="/privacy" className="text-[14px] text-[#888888] transition-all duration-300 hover:text-[#FF6B00]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-[14px] text-[#888888] transition-all duration-300 hover:text-[#FF6B00]">Terms & Conditions</Link></li>
              <li><Link href="/returns" className="text-[14px] text-[#888888] transition-all duration-300 hover:text-[#FF6B00]">Returns & Refunds</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-5 text-[#1A1A1A]">Contact</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-[14px] text-[#888888]">
                <span className="text-[#FF6B00] shrink-0"><i className="fas fa-map-marker-alt"></i></span>
                <span>123 Merdeka Street, Jakarta, Indonesia</span>
              </li>
              <li className="flex gap-3 text-[14px] text-[#888888]">
                <span className="text-[#FF6B00] shrink-0"><i className="fas fa-phone"></i></span>
                <span>+62 21 1234-5678</span>
              </li>
              <li className="flex gap-3 text-[14px] text-[#888888]">
                <span className="text-[#FF6B00] shrink-0"><i className="fas fa-envelope"></i></span>
                <span>hello@bangparjo.com</span>
              </li>
              <li className="flex gap-3 text-[14px] text-[#888888]">
                <span className="text-[#FF6B00] shrink-0"><i className="fas fa-clock"></i></span>
                <span>Mon - Sat: 08:00 - 20:00 (GMT+7)</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="py-6 flex flex-col md:flex-row justify-between items-center text-[14px] text-[#888888]">
          <p>&copy; {year} {settings.storeName}. All rights reserved. | Global Dropshipping Marketplace</p>
          <div className="flex gap-2 text-2xl text-[#888888]">
            <i className="fab fa-cc-visa"></i>
            <i className="fab fa-cc-mastercard"></i>
            <i className="fab fa-cc-paypal"></i>
          </div>
        </div>
      </div>
    </footer>
  );
}
