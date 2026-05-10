import styles from './legal.module.css';

export const metadata = {
  title: 'Privacy Policy | bangparjo.shop',
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Privacy Policy</h1>
        <div className={styles.content}>
          <p>Last updated: May 06, 2026</p>
          <section>
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you make a purchase, subscribe to our newsletter, or contact us for support. This includes your name, email address, shipping address, and payment information.</p>
          </section>
          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use your information to process orders, communicate with you about your purchase, improve our services, and send marketing communications if you have opted in.</p>
          </section>
          <section>
            <h2>3. Information Sharing</h2>
            <p>We share your shipping information with our global suppliers and shipping carriers to fulfill your orders. We do not sell your personal data to third parties.</p>
          </section>
          <section>
            <h2>4. Data Security</h2>
            <p>We implement a variety of security measures to maintain the safety of your personal information. Your payment data is handled by secure third-party processors and is not stored on our servers.</p>
          </section>
          <section>
            <h2>5. Cookies</h2>
            <p>We use cookies to enhance your browsing experience, remember your cart items, and analyze site traffic.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
