import styles from './legal.module.css';

export const metadata = {
  title: 'Terms of Service | bangparjo.shop',
};

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Terms of Service</h1>
        <div className={styles.content}>
          <p>Last updated: May 06, 2026</p>
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using bangparjo.shop, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>
          <section>
            <h2>2. Description of Service</h2>
            <p>bangparjo.shop is an e-commerce platform that provides curated global products through a dropshipping model. We facilitate orders and shipping directly from our global suppliers to your doorstep.</p>
          </section>
          <section>
            <h2>3. Pricing and Payments</h2>
            <p>All prices are listed in USD. We reserve the right to change prices at any time. Payments are processed securely through our authorized payment processors (PayPal, Stripe, etc.).</p>
          </section>
          <section>
            <h2>4. Shipping and Delivery</h2>
            <p>Shipping times are estimates and not guarantees. We are not responsible for delays caused by customs, natural disasters, or carrier issues. Customers are responsible for any import duties or taxes applicable in their country.</p>
          </section>
          <section>
            <h2>5. Intellectual Property</h2>
            <p>All content on this site, including logos, text, and images, is the property of bangparjo.shop or its content suppliers and is protected by international copyright laws.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
