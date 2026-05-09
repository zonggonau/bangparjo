import React from 'react';
import styles from './page.module.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center — bangparjo.shop',
  description: 'Find answers, track your order, and contact our support team.',
};

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const TruckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"></polyline>
    <polyline points="23 20 23 14 17 14"></polyline>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
  </svg>
);

const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
);

const HelpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

export default function HelpCenter() {
  return (
    <div className={styles.helpCenter}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>How can we help you today?</h1>
          <p className={styles.heroSubtitle}>Search for answers or browse our knowledge base.</p>
          <div className={styles.searchBar}>
            <SearchIcon />
            <input type="text" placeholder="Search for tracking, returns, payments..." />
          </div>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className={styles.quickLinks}>
        <div className="container">
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.iconWrapper}><TruckIcon /></div>
              <h3>Shipping & Delivery</h3>
              <p>Track your global orders and view shipping policies.</p>
              <a href="/track">Track Order &rarr;</a>
            </div>
            <div className={styles.card}>
              <div className={styles.iconWrapper}><RefreshIcon /></div>
              <h3>Returns & Refunds</h3>
              <p>Learn about our 30-day money-back guarantee.</p>
              <a href="#returns">Read Policy &rarr;</a>
            </div>
            <div className={styles.card}>
              <div className={styles.iconWrapper}><CreditCardIcon /></div>
              <h3>Payments & Billing</h3>
              <p>Accepted payment methods and currency conversions.</p>
              <a href="#payments">View Details &rarr;</a>
            </div>
            <div className={styles.card}>
              <div className={styles.iconWrapper}><HelpIcon /></div>
              <h3>General FAQs</h3>
              <p>Answers to common questions about our store.</p>
              <a href="#faqs">Browse FAQs &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className={styles.faqsSection} id="faqs">
        <div className="container">
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            
            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                How long does shipping take?
                <span className={styles.faqIcon}>+</span>
              </summary>
              <div className={styles.faqAnswer}>
                <p>Since we source products globally, shipping times vary depending on your location and the supplier's location. Typically, deliveries take between 7 to 15 business days. You can track your order using your tracking number.</p>
              </div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                Do you ship internationally?
                <span className={styles.faqIcon}>+</span>
              </summary>
              <div className={styles.faqAnswer}>
                <p>Yes! We offer worldwide shipping to most countries. Shipping fees and delivery times will be calculated at checkout based on your delivery address.</p>
              </div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                What is your return policy?
                <span className={styles.faqIcon}>+</span>
              </summary>
              <div className={styles.faqAnswer}>
                <p>We offer a 30-day return policy for most items. If you are not satisfied with your purchase, please contact our support team within 30 days of receiving the item to initiate a return or exchange.</p>
              </div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                How can I contact customer support?
                <span className={styles.faqIcon}>+</span>
              </summary>
              <div className={styles.faqAnswer}>
                <p>You can reach out to us via the AI Chat on the bottom right corner of the screen, or email us at support@bangparjo.shop. We aim to respond to all inquiries within 24 hours.</p>
              </div>
            </details>

          </div>
        </div>
      </section>

      {/* Contact Banner */}
      <section className={styles.contactBanner}>
        <div className="container">
          <div className={styles.contactCard}>
            <h2>Still need help?</h2>
            <p>Our support team is always ready to assist you with any questions or concerns.</p>
            <button className={styles.contactBtn}>Contact Support</button>
          </div>
        </div>
      </section>
    </div>
  );
}
