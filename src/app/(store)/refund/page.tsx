import styles from './legal.module.css';

export const metadata = {
  title: 'Refund Policy | bangparjo.shop',
};

export default function RefundPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Refund Policy</h1>
        <div className={styles.content}>
          <p>Last updated: May 06, 2026</p>
          <section>
            <h2>1. Returns</h2>
            <p>Our policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately, we can’t offer you a refund or exchange.</p>
          </section>
          <section>
            <h2>2. Eligibility for Refunds</h2>
            <p>To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.</p>
            <p>Common reasons for refunds include: damaged items, incorrect items received, or items significantly different from the description.</p>
          </section>
          <section>
            <h2>3. Process</h2>
            <p>To initiate a refund, please contact us at support@bangparjo.shop with your order number and photos of the item. We will review your request and notify you of the approval or rejection of your refund.</p>
          </section>
          <section>
            <h2>4. Shipping Costs</h2>
            <p>You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
