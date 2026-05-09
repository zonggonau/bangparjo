import Link from 'next/link';
import styles from './FeaturedSection.module.css';

export default function FeaturedSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {/* Left: Brand story */}
          <div className={styles.brandStory}>
            <span className={styles.badge}>🌟 About Us</span>
            <h2 className={styles.title}>
              Shop Global,<br />
              <span className={styles.highlight}>Easy & Trusted</span>
            </h2>
            <p className={styles.desc}>
              bangparjo.shop is your global dropshipping marketplace, bringing you the best products
              from around the world — delivered straight to your door, no matter where you are.
            </p>
            <div className={styles.highlights}>
              {[
                { icon: '✅', text: 'Verified suppliers via CJ Dropshipping' },
                { icon: '✅', text: 'Worldwide shipping to 200+ countries' },
                { icon: '✅', text: 'Competitive prices, guaranteed quality' },
                { icon: '✅', text: 'Responsive 24/7 customer support' },
              ].map((item) => (
                <div key={item.text} className={styles.highlightItem}>
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <Link href="/?q=best seller" className={styles.cta}>
              Start Shopping →
            </Link>
          </div>

          {/* Right: Stats cards */}
          <div className={styles.statsGrid}>
            {[
              { value: '50,000+', label: 'Products Available', icon: '📦', color: '#FF6B35' },
              { value: '10,000+', label: 'Happy Customers', icon: '😊', color: '#7C3AED' },
              { value: '4.8/5', label: 'Average Rating', icon: '⭐', color: '#F59E0B' },
              { value: '99%', label: 'Customer Satisfaction', icon: '💯', color: '#10B981' },
            ].map((stat) => (
              <div key={stat.label} className={styles.statCard} style={{ '--stat-color': stat.color } as React.CSSProperties}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statValue} style={{ color: stat.color }}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
