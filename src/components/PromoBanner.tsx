import Link from 'next/link';
import styles from './PromoBanner.module.css';

export default function PromoBanner() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {/* Main promo */}
          <div className={styles.mainPromo} style={{ background: 'linear-gradient(135deg, #FF6B35, #E94560)' }}>
            <div className={styles.promoBadge}>🔥 Community Hot</div>
            <h3 className={styles.promoTitle}>Viral Finds</h3>
            <p className={styles.promoSubtitle}>Up to 70% OFF</p>
            <p className={styles.promoDesc}>Trending products the community is loving right now</p>
            <Link href="/?q=trending" className={styles.promoBtn}>
              Shop the Hype →
            </Link>
            <div className={styles.promoDeco}>🔥</div>
          </div>

          {/* Sub promos */}
          <div className={styles.subPromos}>
            <div className={styles.subPromo} style={{ background: 'linear-gradient(135deg, #1A1A2E, #0F3460)' }}>
              <h4 className={styles.subTitle}>📱 Trending Tech</h4>
              <p className={styles.subDesc}>Community faves from $3</p>
              <Link href="/?q=tech trending" className={styles.subBtn}>Shop →</Link>
            </div>
            <div className={styles.subPromo} style={{ background: 'linear-gradient(135deg, #6B46C1, #553C9A)' }}>
              <h4 className={styles.subTitle}>👗 Viral Style</h4>
              <p className={styles.subDesc}>Outfits everyone is talking about</p>
              <Link href="/?q=trendy fashion" className={styles.subBtn}>Shop →</Link>
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
