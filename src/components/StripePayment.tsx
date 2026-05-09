'use client';

import { useState } from 'react';

interface StripePaymentProps {
  orderId: string;
  amount: number;
  customerEmail: string;
}

export default function StripePayment({ orderId, amount, customerEmail }: StripePaymentProps) {
  const [loading, setLoading] = useState(false);

  // Check if stripe is configured (using a heuristic since secret key isn't public)
  const isConfigured = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('your_stripe_publishable');

  if (!isConfigured) {
    return (
      <div style={{ padding: '1rem', background: '#f3f0ff', border: '1px solid #7048e8', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem' }}>
        ⚠️ <strong>Stripe Not Configured:</strong> Please set <code>STRIPE_SECRET_KEY</code> in your <code>.env.local</code>.
      </div>
    );
  }

  const handleStripe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, customerEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create Stripe session: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong with Stripe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleStripe}
      disabled={loading}
      style={{
        width: '100%',
        padding: '1rem',
        borderRadius: '12px',
        background: '#635bff',
        color: 'white',
        fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}
    >
      {loading ? '⏳ Redirecting...' : '💳 Pay with Card (Stripe)'}
    </button>
  );
}
