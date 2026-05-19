'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import PayPalButton from '@/components/PayPalButton';
import MidtransPayment from '@/components/MidtransPayment';
import ProductImage from '@/components/ProductImage';

function formatUSD(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatIDR(price: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
}

function SecurePaymentContent() {
  const { orderNum } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get('id');
  const { settings } = useSettings();
  const { clearCart } = useCart();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(16000);
  const [rateLoading, setRateLoading] = useState(true);

  useEffect(() => {
    if (!orderNum || !token) {
      setError('Missing order information or security token.');
      setLoading(false);
      return;
    }

    fetch(`/api/orders?orderNum=${orderNum}&token=${token}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setOrder(res.data);
          if (res.data.status === 'PAID') setIsPaid(true);
          
          clearCart();

          fetch('/api/orders/send-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              orderNum, 
              token,
              checkoutUrl: window.location.href
            })
          }).then(r => r.json())
            .then(res => {
              if (res.success && res.message !== 'Email already sent previously') {
                console.log('[SecurePayment] Confirmation email sent.');
              }
            }).catch(console.error);
        } else {
          setError(res.error || 'Failed to load order details.');
        }
      })
      .catch(err => {
        console.error('Fetch order error:', err);
        setError('An unexpected error occurred while loading your order.');
      })
      .finally(() => setLoading(false));
  }, [orderNum, token]);

  // Fetch real-time USD to IDR exchange rate
  useEffect(() => {
    fetch('/api/currency/rate')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.rate) {
          setExchangeRate(data.rate);
        }
      })
      .catch(err => console.error('[Currency] Failed to fetch rate:', err))
      .finally(() => setRateLoading(false));
  }, []);

  const onPaymentSuccess = () => {
    setIsPaid(true);
    clearCart();
  };

  if (loading) return (
    <div className="py-[100px] text-center">
      <i className="fas fa-spinner fa-spin fa-3x text-[#FF6B00] mb-6"></i>
      <p className="text-gray-500">Securing your payment session...</p>
    </div>
  );

  if (error) return (
    <div className="py-[100px] text-center">
      <div className="max-w-[500px] mx-auto p-10 bg-white rounded-[24px] border border-gray-200">
        <i className="fas fa-exclamation-triangle fa-3x text-red-500 mb-6"></i>
        <h2 className="text-2xl font-bold mb-4 text-[#1A1A1A]">Security Error</h2>
        <p className="text-gray-500 mb-8">{error}</p>
        <Link href="/cart" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline">Return to Cart</Link>
      </div>
    </div>
  );

  const orderData = typeof order.orderData === 'string' ? JSON.parse(order.orderData) : order.orderData;
  const country = orderData.shippingCountryCode;
  const products = orderData.products || [];
  const isIndonesia = country === 'ID';

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareMessage = `Hi! Here is your secure payment link for Order #${orderNum}: ${currentUrl}. Please complete the payment within 24 hours.`;

  return (
    <div className="py-16">
      <div className="max-w-[800px] mx-auto px-5">
        <div className="bg-white rounded-[24px] p-10 border border-gray-200">
          <div className="text-center mb-8">
            <div className={`flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-6 text-3xl ${isPaid ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-[#FF6B00]'}`}>
              <i className={isPaid ? 'fas fa-check' : 'fas fa-shield-alt'}></i>
            </div>
            <h1 className="text-[32px] font-black text-[#1A1A1A] mb-2">
              {isPaid ? 'Order Placed Successfully' : 'Finalize Your Payment'}
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[50px] font-bold bg-orange-50 text-[#FF6B00]">
              <i className="fas fa-clipboard-list"></i>
              Order #{orderNum}
            </div>
            {!isPaid && (
              <p className="mt-4 text-amber-500 font-bold text-sm">
                <i className="far fa-clock"></i> Payment deadline: 24 hours
              </p>
            )}
          </div>

          <div>
            {isPaid ? (
              <div className="text-center bg-gray-50 p-6 rounded-[16px]">
                <h3 className="text-lg font-extrabold mb-3 text-[#1A1A1A]">Thank you for your purchase!</h3>
                <p className="text-gray-500 leading-relaxed">
                  We've received your payment and our team is currently processing your order. 
                  You will receive an email update with tracking information once your package ships.
                </p>
                <div className="mt-8">
                   <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline">Continue Shopping</Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-white border border-gray-200 p-6 rounded-[16px] mb-8">
                  <h4 className="text-sm font-extrabold text-gray-500 uppercase mb-4">Order Summary:</h4>
                  <div className="flex flex-col gap-3 mb-5">
                     <p className="text-sm text-gray-600"><strong>Customer:</strong> {order.customerName}</p>
                     <p className="text-sm text-gray-600"><strong>Shipping:</strong> {orderData.shippingCity}, {orderData.shippingCountry}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-200">
                    <span className="font-semibold text-gray-500">Amount to Pay</span>
                    <div className="text-right">
                      <strong className="text-[28px] text-[#FF6B00] block">{formatIDR(order.totalAmount * exchangeRate)}</strong>
                      <span className="text-[13px] text-gray-400">≈ {formatUSD(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-xl font-black mb-2 text-[#1A1A1A]">
                    Select Payment Method
                  </h3>
                  <p className="text-gray-500">
                    Please choose your preferred secure payment method below.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-5 w-full max-w-[480px] mx-auto">
                  {isIndonesia ? (
                    <>
                      <div className="w-full">
                        <div className="text-xs font-extrabold text-gray-500 uppercase text-center mb-3">
                          🇮🇩 Pembayaran Lokal (QRIS / Virtual Account / Kartu)
                        </div>
                        <MidtransPayment 
                          orderId={order.orderNum} 
                          amount={Math.round(order.totalAmount * exchangeRate)} 
                          customerDetails={{
                            name: order.customerName,
                            email: order.customerEmail,
                            phone: order.customerPhone || ''
                          }}
                          onSuccess={onPaymentSuccess}
                          autoTrigger={false}
                        />
                      </div>

                      <div className="flex items-center gap-4 w-full text-gray-300">
                        <div className="flex-1 h-px bg-current"></div>
                        <span className="text-xs font-bold">ATAU</span>
                        <div className="flex-1 h-px bg-current"></div>
                      </div>

                      <div className="w-full">
                        <div className="text-xs font-extrabold text-gray-500 uppercase text-center mb-3">
                          🌍 Pembayaran Global (PayPal)
                        </div>
                        <PayPalButton 
                          amount={order.totalAmount} 
                          orderId={order.orderNum} 
                          onSuccess={onPaymentSuccess} 
                        />
                      </div>
                    </>
                  ) : (
                    <div className="w-full">
                      <div className="text-xs font-extrabold text-gray-500 uppercase text-center mb-3">
                        🌍 Global Payment (PayPal / Credit Card)
                      </div>
                      <PayPalButton 
                        amount={order.totalAmount} 
                        orderId={order.orderNum} 
                        onSuccess={onPaymentSuccess} 
                      />
                    </div>
                  )}
                </div>

              
              </div>
            )}
          </div>

          {!isPaid && (
            <div className="text-center mt-10 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-400 mb-4">
                 Changed your mind? Your items are still in your cart.
              </p>
              <Link href="/cart" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold border border-gray-200 text-[#1A1A1A] hover:bg-gray-50 transition-all duration-200 no-underline">
                <i className="fas fa-arrow-left"></i>
                Return to Cart
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DedicatedPaymentPage() {
  return (
    <Suspense fallback={<div className="py-[100px] text-center text-gray-500">Loading...</div>}>
      <SecurePaymentContent />
    </Suspense>
  );
}
