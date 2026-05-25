'use client';

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";
import { capturePayPalOrderAction } from '@/lib/actions';

interface PayPalButtonProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
}

export default function PayPalButton({ amount, orderId, onSuccess }: PayPalButtonProps) {
  const [error, setError] = useState<string | null>(null);

  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const isPlaceholder = !PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID.includes("your_paypal_client_id");

  if (isPlaceholder) {
    return (
      <div style={{ padding: '1rem', background: '#fff9db', border: '1px solid #fab005', borderRadius: '12px', marginTop: '1rem', fontSize: '0.85rem' }}>
        ⚠️ <strong>PayPal Not Configured:</strong> Please set a valid <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> in your <code>.env.local</code> file to enable PayPal payments.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}>
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: "pay" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  reference_id: orderId,
                  custom_id: orderId, // Sangat berguna untuk Webhooks
                  amount: {
                    currency_code: "USD",
                    value: amount.toFixed(2),
                  },
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            if (actions.order) {
              const details = await actions.order.capture();
              
              // Call our backend to update status
              const resData = await capturePayPalOrderAction({
                orderId: orderId,
                paypalData: details
              });
              if (resData.success) {
                onSuccess();
              } else {
                setError("Payment captured but failed to update order status. Please contact support.");
              }
            }
          }}
          onError={(err) => {
            console.error("PayPal Error:", err);
            setError("PayPal connection error. Please try again or use another method.");
          }}
        />
      </PayPalScriptProvider>
      {error && <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
