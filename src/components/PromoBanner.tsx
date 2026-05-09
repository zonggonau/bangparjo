import Link from 'next/link';
import styles from './PromoBanner.module.css';

export default function PromoBanner() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {/* Main promo */}
          <div className={styles.mainPromo} style={{ background: 'linear-gradient(135deg, #FF6B35, #E94560)' }}>
            <div className={styles.promoBadge}>Limited Time</div>
            <h3 className={styles.promoTitle}>Flash Sale</h3>
            <p className={styles.promoSubtitle}>Up to 70% OFF</p>
            <p className={styles.promoDesc}>Thousands of handpicked products at special prices</p>
            <Link href="/?q=sale discount" className={styles.promoBtn}>
              Shop Now →
            </Link>
            <div className={styles.promoDeco}>🔥</div>
          </div>

          {/* Sub promos */}
          <div className={styles.subPromos}>
            <div className={styles.subPromo} style={{ background: 'linear-gradient(135deg, #1A1A2E, #0F3460)' }}>
              <h4 className={styles.subTitle}>📱 Top Electronics</h4>
              <p className={styles.subDesc}>Starting from $3</p>
              <Link href="/category/electronics" className={styles.subBtn}>Shop →</Link>
            </div>
            <div className={styles.subPromo} style={{ background: 'linear-gradient(135deg, #6B46C1, #553C9A)' }}>
              <h4 className={styles.subTitle}>👗 Fashion Update</h4>
              <p className={styles.subDesc}>New arrivals every week</p>
              <Link href="/category/womens-clothing" className={styles.subBtn}>Shop →</Link>
            </div>
            <div className={styles.subPromo} style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
              <h4 className={styles.subTitle}>🚚 Free Shipping</h4>
              <p className={styles.subDesc}>On orders over $50</p>
              <Link href="/?q=trending" className={styles.subBtn}>Shop →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
