'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';

function formatUSD(price: number | string | null | undefined) {
  const p = typeof price === 'string' ? parseFloat(price) : (price || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  let badgeClass = 'bg-gray-100 text-gray-600';
  if (['PAID', 'DELIVERED', 'COMPLETED', 'FULFILLED'].includes(s)) badgeClass = 'bg-green-100 text-green-700';
  if (['SHIPPED'].includes(s)) badgeClass = 'bg-blue-100 text-blue-700';
  if (['PENDING', 'UNPAID', 'PROCESSING'].includes(s)) badgeClass = 'bg-orange-100 text-[#FF6B00]';
  if (['CANCELLED', 'FAILED'].includes(s)) badgeClass = 'bg-red-100 text-red-600';
  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>{s.toLowerCase()}</span>;
}

export default function CustomerOrderDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderNum = params.orderNum as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!orderNum || !session?.user?.email) return;
    setLoading(true);
    fetch(`/api/orders/customer?email=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find((o: any) => o.orderNum === orderNum);
          if (found) {
            setOrder(found);
          } else {
            setError('Order not found.');
          }
        } else {
          setError('Failed to load order.');
        }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, [orderNum, session]);

  // Fetch tracking info
  useEffect(() => {
    if (!order?.status || order.status === 'UNPAID') return;
    setTrackingLoading(true);
    fetch(`/api/orders/track?id=${orderNum}`)
      .then(r => r.json())
      .then(d => { if (d.success) setTracking(d.order); })
      .catch(console.error)
      .finally(() => setTrackingLoading(false));
  }, [order?.status, orderNum]);

  if (status === 'loading' || loading) {
    return (
      <div className="py-[100px] text-center">
        <i className="fas fa-spinner fa-spin fa-2x text-[#FF6B00]"></i>
        <p className="mt-4 text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!session) return null;

  if (error || !order) {
    return (
      <div className="py-[100px] text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Order Not Found</h3>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <Link href="/account/orders" className="inline-flex items-center px-5 py-2.5 rounded-md font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline">
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  const address = order.shippingAddress as any;
  const items = order.items || [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/account/orders" className="text-sm text-[#FF6B00] font-semibold no-underline hover:underline">
            &larr; Back to Orders
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold mt-2 text-[#1A1A1A]">Order #{order.orderNum.slice(0, 12)}...</h2>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-[12px] border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Order Date</p>
          <p className="text-sm font-bold text-[#1A1A1A]">{formatDate(order.createdAt)}</p>
        </div>
        <div className="bg-white rounded-[12px] border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Amount</p>
          <p className="text-sm font-bold text-[#FF6B00]">{formatUSD(order.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-[12px] border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
          <p className="text-sm font-bold text-[#1A1A1A] capitalize">{order.status.toLowerCase()}</p>
        </div>
        <div className="bg-white rounded-[12px] border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tracking</p>
          <p className="text-sm font-bold text-[#1A1A1A]">
            {trackingLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : order.trackingNumber ? (
              <a href={`https://www.17track.net/en/result?nums=${order.trackingNumber}`} target="_blank" rel="noreferrer" className="text-[#FF6B00] no-underline hover:underline">
                {order.trackingNumber}
              </a>
            ) : (
              'Not shipped yet'
            )}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-[12px] border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-[#1A1A1A]">Order Items ({items.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item: any) => {
            const variant = item.variant;
            const product = variant?.product;
            return (
              <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                {product?.images?.[0] && (
                  <img src={product.images[0]} alt="" className="w-16 h-16 rounded-[8px] object-cover border border-gray-200" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1A1A1A] truncate">{product?.name || 'Product'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {variant?.color || variant?.size ? `${variant.color || ''} ${variant.size || ''}`.trim() : 'Standard'} × {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1A1A1A]">{formatUSD(item.price)}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        {address && (
          <div className="bg-white rounded-[12px] border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-[#FF6B00]"></i> Shipping Address
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-[#1A1A1A]">{address.name || order.customerName}</p>
              <p>{address.line1 || address.address}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>{address.city}, {address.state} {address.postal_code || address.zip}</p>
              <p>{address.country}</p>
              <p className="mt-2 text-xs text-gray-400"><i className="fas fa-phone"></i> {address.phone || order.customerPhone}</p>
            </div>
          </div>
        )}

        {/* Tracking Timeline */}
        <div className="bg-white rounded-[12px] border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
            <i className="fas fa-truck text-[#FF6B00]"></i> Order Timeline
          </h3>
          <div className="space-y-4">
            {[
              { status: 'UNPAID', label: 'Order Placed', date: order.createdAt, done: true },
              { status: 'PAID', label: 'Payment Confirmed', date: order.createdAt, done: order.status !== 'UNPAID' && order.status !== 'PENDING' },
              { status: 'PROCESSING', label: 'Processing', done: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status.toUpperCase()) },
              { status: 'SHIPPED', label: 'Shipped', done: ['SHIPPED', 'DELIVERED'].includes(order.status.toUpperCase()) },
              { status: 'DELIVERED', label: 'Delivered', done: order.status.toUpperCase() === 'DELIVERED' },
            ].map((step, idx) => (
              <div key={step.status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-[#FF6B00] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {step.done ? <i className="fas fa-check"></i> : idx + 1}
                  </div>
                  {idx < 4 && <div className="w-0.5 h-6 bg-gray-200"></div>}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${step.done ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>{step.label}</p>
                  {step.date && <p className="text-xs text-gray-400">{formatDate(step.date)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
