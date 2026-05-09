'use client';

import { useState } from 'react';
import styles from './Newsletter.module.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSubscribed(true);
        setEmail('');
      } else {
        setError(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };


  if (subscribed) {
    return (
      <section className={styles.newsletter}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.successIcon}>🎉</div>
            <h2 className={styles.title}>You&apos;re on the list!</h2>
            <p className={styles.subtitle}>Thank you for subscribing. Check your inbox for your 10% discount code.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.newsletter}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.textSide}>
            <span className={styles.badge}>Join the Club</span>
            <h2 className={styles.title}>Subscribe for <span className={styles.highlight}>10% OFF</span> Your First Order</h2>
            <p className={styles.subtitle}>Get exclusive access to new arrivals, sales, and trending global products delivered to your inbox.</p>
          </div>
          <div className={styles.formSide}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <button type="submit" className={styles.button} disabled={loading}>
                  {loading ? 'Subscribing...' : 'Subscribe Now'}
                </button>
              </div>
              {error && <p className={styles.errorMessage}>⚠️ {error}</p>}
              <p className={styles.privacy}>By subscribing, you agree to our <a href="#">Privacy Policy</a> and <a href="#">Terms of Service</a>.</p>

            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
