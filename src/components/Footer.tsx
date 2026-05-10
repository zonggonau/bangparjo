'use client';

import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  const { settings } = useSettings();
  return (
    <footer className="footer">
      <div className="footerGrid">
        {/* Brand Column */}
        <div className="footerBrand">
          <div className="logo" style={{ marginBottom: '0.75rem' }}>
            <div className="logoIcon">🛍️</div>
            <span className="logoText">{settings.storeName}</span>
          </div>
          <p className="footerDesc">
            Your trusted global e-commerce marketplace.
            Thousands of curated products from around the world, delivered straight to your door — wherever you are.
          </p>
          <div className="footerSocials">
            <a href="#" className="footerSocialBtn" aria-label="Facebook">📘</a>
            <a href="#" className="footerSocialBtn" aria-label="Instagram">📸</a>
            <a href="#" className="footerSocialBtn" aria-label="TikTok">🎵</a>
            <a href="#" className="footerSocialBtn" aria-label="WhatsApp">💬</a>
          </div>
        </div>

        {/* Shop Links */}
        <div className="footerColumn">
          <h4>Shop</h4>
          <ul>
            <li><Link href="/category/womens-clothing">Women&apos;s Fashion</Link></li>
            <li><Link href="/category/mens-clothing">Men&apos;s Fashion</Link></li>
            <li><Link href="/category/electronics">Electronics</Link></li>
            <li><Link href="/category/beauty">Beauty & Care</Link></li>
            <li><Link href="/category/home-kitchen">Home & Kitchen</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div className="footerColumn">
          <h4>Customer Service</h4>
          <ul>
            <li><Link href="/track">Track My Order</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
            <li><Link href="/refund">Return Policy</Link></li>
            <li><Link href="/help-center#shipping">Shipping Info</Link></li>
            <li><Link href="/help-center#faqs">FAQ</Link></li>
          </ul>
        </div>

        {/* Newsletter Section */}
        <div className="footerColumn" style={{ minWidth: '260px' }}>
          <h4>Stay Updated</h4>
          <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: '1rem', lineHeight: '1.5' }}>
            Get exclusive offers, new product alerts, and shopping tips directly in your inbox.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="footerBottom">
        <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved. 🌍 Shipping worldwide.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Payment Methods:</span>
          <span style={{ fontSize: '1.2rem' }}>💳</span>
          <span style={{ fontSize: '1.2rem' }}>🏦</span>
          <span style={{ fontSize: '1.2rem' }}>📱</span>
        </div>
      </div>
    </footer>
  );
}
