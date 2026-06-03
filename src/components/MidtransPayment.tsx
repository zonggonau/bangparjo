'use client';

import { useEffect, useState, useRef } from 'react';
import { getMidtransTokenAction, verifyMidtransPaymentAction } from '@/lib/actions';

interface MidtransPaymentProps {
  orderId: string;
  amount: number;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  onSuccess: () => void;
  autoTrigger?: boolean;
}

export default function MidtransPayment({ orderId, amount, customerDetails, onSuccess, autoTrigger }: MidtransPaymentProps) {
  const [loading, setLoading] = useState(false);
  const isProcessing = useRef(false);
  const lastProcessedToken = useRef<string | null>(null);

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

  useEffect(() => {
    let timeout: any;
    if (autoTrigger && !loading) {
      // Add a small stability delay for auto-trigger
      timeout = setTimeout(() => {
        handlePayment();
      }, 500);
    }
    return () => clearTimeout(timeout);
  }, [autoTrigger]);

  const handlePayment = async () => {
    // Synchronous check using ref to prevent multiple clicks or auto-triggers
    if (isProcessing.current) return;
    
    // @ts-ignore
    if (typeof window !== 'undefined' && !window.snap) {
      console.warn('[Midtrans] Snap script not ready, retrying...');
      setTimeout(handlePayment, 1000);
      return;
    }

    isProcessing.current = true;
    setLoading(true);

    try {
      const data = await getMidtransTokenAction({ orderId, customerDetails });

      if (data.token) {
        // Prevent re-opening if it's the exact same token we just processed
        if (lastProcessedToken.current === data.token) {
          isProcessing.current = false;
          setLoading(false);
          return;
        }

        lastProcessedToken.current = data.token;

        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: async function(result: any) {
            console.log('Midtrans Success:', result);
            setLoading(true);
            try {
              const res = await verifyMidtransPaymentAction({
                orderId,
                midtransOrderId: result.order_id
              });
              if (res.success) {
                console.log('[Midtrans Client] Verified & fulfilled successfully:', res);
              } else {
                console.warn('[Midtrans Client] Verification warning:', res.error);
              }
            } catch (err) {
              console.error('[Midtrans Client] Error during verification:', err);
            } finally {
              isProcessing.current = false;
              setLoading(false);
              onSuccess();
            }
          },
          onPending: function(result: any) {
            console.log('Midtrans Pending:', result);
            isProcessing.current = false;
            setLoading(false);
            alert("Waiting for your payment...");
          },
          onError: function(result: any) {
            console.error('Midtrans Error:', result);
            isProcessing.current = false;
            setLoading(false);
            alert("Payment failed!");
          },
          onClose: function() {
            console.log('Midtrans Closed');
            // Allow retry after close
            isProcessing.current = false;
            setLoading(false);
          }
        });
      } else {
        throw new Error(data.error || 'Token not received');
      }
    } catch (err) {
      console.error('[Midtrans Error]:', err);
      isProcessing.current = false;
      setLoading(false);
      alert("Error generating payment session. Please try again.");
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
