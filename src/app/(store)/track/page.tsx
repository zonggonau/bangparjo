'use client';

import { useState } from 'react';
import { getTrackingInfo } from '@/lib/cj-api';
import Link from 'next/link';
import styles from './track.module.css';

export default function TrackPage() {
  const [orderId, setOrderId] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const response = await getTrackingInfo(orderId.trim());
      if (response.success) {
        setTrackingData(response.data);
      } else {
        setError(response.message || 'Tracking information not found.');
      }
    } catch {
      setError('An error occurred while fetching tracking information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>🚚</div>
          <h1 className={styles.heroTitle}>Track Your Order</h1>
          <p className={styles.heroDesc}>
            Enter your Order ID to view your shipment status in real time
          </p>

          <form onSubmit={handleTrack} className={styles.form}>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>📦</span>
              <input
                type="text"
                placeholder="Enter your Order ID..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className={styles.input}
                id="track-order-input"
              />
            </div>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? (
                <span className={styles.loadingSpinner}>⏳ Tracking...</span>
              ) : (
                '🔍 Track Now'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '2rem var(--container-padding)' }}>
        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <span>❌</span>
            <p>{error}</p>
          </div>
        )}

        {/* Tracking Result */}
        {trackingData && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <h2>Tracking Details</h2>
              <span className={styles.statusBadge}>
                {trackingData.orderStatus || 'In Transit'}
              </span>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>📦 Order ID</span>
                <span className={styles.infoValue}>{orderId}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>🚚 Carrier</span>
                <span className={styles.infoValue}>{trackingData.logisticName || '-'}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>🔢 Tracking Number</span>
                <span className={styles.infoValue}>{trackingData.trackNumber || 'Pending'}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>📊 Order Status</span>
                <span className={styles.infoValue}>{trackingData.orderStatus || 'Processing'}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>📅 Order Date</span>
                <span className={styles.infoValue}>{trackingData.createDate || '-'}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>💰 Order Total</span>
                <span className={styles.infoValue}>${trackingData.orderAmount ?? '-'} USD</span>
              </div>
            </div>

            <div className={styles.timeline}>
              <h3>Shipping Timeline</h3>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div>
                  <p className={styles.timelineTitle}>Order Processing</p>
                  <p className={styles.timelineDesc}>Your package is being prepared by the seller</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Steps Guide */}
        {!trackingData && !error && (
          <div className={styles.guide}>
            <h2 className={styles.guideTitle}>How to Track Your Order</h2>
            <div className={styles.steps}>
              {[
                { step: '1', icon: '📧', title: 'Check Confirmation Email', desc: 'Find your Order ID in the purchase confirmation email' },
                { step: '2', icon: '📋', title: 'Enter Order ID', desc: 'Copy and paste your Order ID into the field above' },
                { step: '3', icon: '🔍', title: 'Click Track', desc: 'Click "Track Now" to view your shipment status' },
                { step: '4', icon: '📍', title: 'View Status', desc: 'Your package status and location will be displayed' },
              ].map((step) => (
                <div key={step.step} className={styles.stepCard}>
                  <div className={styles.stepNumber}>{step.step}</div>
                  <div className={styles.stepIcon}>{step.icon}</div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>

            <div className={styles.helpBox}>
              <span>💬</span>
              <div>
                <strong>Need help?</strong>
                <p>Contact our customer service or <Link href="/">continue shopping</Link></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
