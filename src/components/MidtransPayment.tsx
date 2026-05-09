'use client';

import { useEffect, useState } from 'react';

interface MidtransPaymentProps {
  orderId: string;
  amount: number;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  onSuccess: () => void;
}

export default function MidtransPayment({ orderId, amount, customerDetails, onSuccess }: MidtransPaymentProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Midtrans Snap Script
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const midtransScriptUrl = isProduction 
      ? 'https://app.midtrans.com/snap/snap.js' 
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';

    let script = document.querySelector(`script[src="${midtransScriptUrl}"]`) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = midtransScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/midtrans/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, customerDetails }),
      });
      const data = await res.json();

      if (data.token) {
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: function(result: any) {
            console.log('Midtrans Success:', result);
            onSuccess();
          },
          onPending: function(result: any) {
            console.log('Midtrans Pending:', result);
            alert("Waiting for your payment...");
          },
          onError: function(result: any) {
            console.error('Midtrans Error:', result);
            alert("Payment failed!");
          },
          onClose: function() {
            console.log('Midtrans Closed');
          }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment} 
      disabled={loading}
      style={{
        width: '100%',
        padding: '1rem',
        borderRadius: '12px',
        background: '#002855',
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
      {loading ? '⏳ Menyiapkan...' : '💳 Bayar via Midtrans (QRIS/VA/Kartu)'}
    </button>
  );
}
