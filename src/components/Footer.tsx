'use client';

import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';
import NewsletterForm from './NewsletterForm';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Globe,
  ShoppingCart
} from 'lucide-react';

export default function Footer() {
  const { settings } = useSettings();
  
  return (
    <footer className="bg-[#0f0f1a] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Top Section: Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-16 border-b border-white/5 mb-16">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Truck size={24} />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Free Shipping</h4>
            <p className="text-xs text-gray-500">On all orders over ${settings.freeShippingThreshold}</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Secure Payment</h4>
            <p className="text-xs text-gray-500">100% secure payment processing</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <RotateCcw size={24} />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">30-Day Returns</h4>
            <p className="text-xs text-gray-500">Easy returns if not satisfied</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Globe size={24} />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Global Sourcing</h4>
            <p className="text-xs text-gray-500">From verified global suppliers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <ShoppingCart size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-outfit text-xl font-bold text-white">{settings.storeName}</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Your trusted global e-commerce destination. Discover thousands of curated products from around the world, delivered straight to your door.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-black transition-all duration-300">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-black transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-black transition-all duration-300">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-black transition-all duration-300">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Shop Collection</h4>
            <ul className="space-y-4">
              <li><Link href="/category/womens-clothing" className="text-sm text-gray-400 hover:text-primary transition-colors">Women&apos;s Fashion</Link></li>
              <li><Link href="/category/mens-clothing" className="text-sm text-gray-400 hover:text-primary transition-colors">Men&apos;s Fashion</Link></li>
              <li><Link href="/category/electronics" className="text-sm text-gray-400 hover:text-primary transition-colors">Electronics</Link></li>
              <li><Link href="/category/beauty" className="text-sm text-gray-400 hover:text-primary transition-colors">Beauty & Care</Link></li>
              <li><Link href="/category/home-kitchen" className="text-sm text-gray-400 hover:text-primary transition-colors">Home & Kitchen</Link></li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Customer Care</h4>
            <ul className="space-y-4">
              <li><Link href="/track" className="text-sm text-gray-400 hover:text-primary transition-colors">Track My Order</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-400 hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/refund" className="text-sm text-gray-400 hover:text-primary transition-colors">Return Policy</Link></li>
              <li><Link href="/help-center" className="text-sm text-gray-400 hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-400 hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Newsletter</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Join our community and get 10% off your first order plus exclusive deals.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-medium text-gray-500">
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved. 
            <span className="mx-2 text-white/10">|</span>
            Powered by global fulfillment.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
               <div className="w-8 h-5 bg-white/10 rounded-sm" />
               <div className="w-8 h-5 bg-white/10 rounded-sm" />
               <div className="w-8 h-5 bg-white/10 rounded-sm" />
            </div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Ships Globally 🌍</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

