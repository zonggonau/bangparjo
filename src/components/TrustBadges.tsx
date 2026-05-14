'use client';

import styles from './TrustBadges.module.css';

export default function TrustBadges() {
  const badges = [
    { icon: '👥', title: 'Community Love', desc: 'Shop alongside thousands of happy community members' },
    { icon: '🔥', title: 'Trending Daily', desc: 'Fresh viral finds updated every day — never boring' },
    { icon: '🔄', title: 'Easy Returns', desc: '30-day money back guarantee, no questions asked' },
    { icon: '💳', title: 'Secure & Safe', desc: 'Encrypted payments so you can shop with peace of mind' },
  ];

  return (
    <section className={styles.trustSection}>
      <div className="container">
        <div className={styles.badgeGrid}>
          {badges.map((badge) => (
            <div key={badge.title} className={styles.badgeCard}>
              <div className={styles.icon}>{badge.icon}</div>
              <div className={styles.text}>
                <h3 className={styles.title}>{badge.title}</h3>
                <p className={styles.desc}>{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.payments}>
          <p className={styles.paymentTitle}>Accepted Payment Methods</p>
          <div className={styles.paymentLogos}>
            {/* Using text representations or common symbols for a premium look */}
            <div className={styles.paymentItem}><span>Visa</span></div>
            <div className={styles.paymentItem}><span>Mastercard</span></div>
            <div className={styles.paymentItem}><span>GoPay</span></div>
            <div className={styles.paymentItem}><span>OVO</span></div>
            <div className={styles.paymentItem}><span>Dana</span></div>
            <div className={styles.paymentItem}><span>QRIS</span></div>
            <div className={styles.paymentItem}><span>PayPal</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
