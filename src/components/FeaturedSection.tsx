import Link from 'next/link';
import styles from './FeaturedSection.module.css';

export default function FeaturedSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {/* Left: Brand story */}
          <div className={styles.brandStory}>
            <span className={styles.badge}>🌟 Join the Movement</span>
            <h2 className={styles.title}>
              Shop the Hype,<br />
              <span className={styles.highlight}>Love the Vibe</span>
            </h2>
            <p className={styles.desc}>
              BangParjo is your social shopping hub. Discover what&apos;s trending, share with friends,
              and shop community-curated finds that match your vibe.
            </p>
            <div className={styles.highlights}>
              {[
                { icon: '🔥', text: 'Trending products updated daily' },
                { icon: '👥', text: 'Shop with your community, share with friends' },
                { icon: '✨', text: 'Curated picks just for you' },
                { icon: '💬', text: 'Real reviews from real people' },
              ].map((item) => (
                <div key={item.text} className={styles.highlightItem}>
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <Link href="/?q=trending" className={styles.cta}>
              Explore Trending →
            </Link>
          </div>

          {/* Right: Stats cards */}
          <div className={styles.statsGrid}>
            {[
              { value: '10K+', label: 'Community Members', icon: '👥', color: '#FF6B35' },
              { value: '50K+', label: 'Trending Finds', icon: '🔥', color: '#7C3AED' },
              { value: '4.8★', label: 'Community Rating', icon: '⭐', color: '#F59E0B' },
              { value: '99%', label: 'Would Share with Friends', icon: '💯', color: '#10B981' },
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
