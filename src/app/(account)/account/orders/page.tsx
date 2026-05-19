'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function formatUSD(price: number | string | null | undefined) {
  const p = typeof price === 'string' ? parseFloat(price) : (price || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  let badgeClass = 'bg-gray-100 text-gray-600';
  if (['PAID', 'DELIVERED'].includes(s)) badgeClass = 'bg-green-100 text-green-700';
  if (['PENDING', 'UNPAID', 'PROCESSING'].includes(s)) badgeClass = 'bg-orange-100 text-[#FF6B00]';
  if (['CANCELLED', 'FAILED'].includes(s)) badgeClass = 'bg-red-100 text-red-600';
  
  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>{s.toLowerCase()}</span>;
}

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/orders/customer?email=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setOrders(data.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="py-[100px] text-center">
        <i className="fas fa-spinner fa-spin fa-2x text-[#FF6B00]"></i>
        <p className="mt-4 text-gray-500">Loading your orders...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 text-[#1A1A1A]">My Orders</h2>

      {orders.length === 0 ? (
        <div className="border border-gray-200 rounded-[12px] bg-white py-12 sm:py-16 text-center">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📋</div>
          <p className="text-gray-400 mb-1 text-base sm:text-lg">No orders yet</p>
          <p className="text-gray-400 text-xs sm:text-sm mb-5 sm:mb-6">Start shopping to see your orders here!</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-md text-sm sm:text-base font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-[12px] overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 sm:px-5 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="text-left px-3 sm:px-5 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-3 sm:px-5 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-3 sm:px-5 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold">
                      <Link href={`/checkout/${order.orderNum}?id=${order.checkoutToken}`} className="text-inherit no-underline hover:text-[#FF6B00]">
                        #{order.orderNum.length > 10 ? order.orderNum.slice(0, 10) + '...' : order.orderNum}
                      </Link>
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-3.5"><StatusBadge status={order.status} /></td>
                    <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap">{formatUSD(order.totalAmount)}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-right">
                      <Link 
                        href={order.status === 'UNPAID' ? `/checkout/${order.orderNum}?id=${order.checkoutToken}` : `/track?orderNum=${order.orderNum}`} 
                        className="inline-flex items-center justify-center px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-sm font-semibold border border-gray-200 text-[#1A1A1A] hover:bg-gray-50 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-all duration-200 no-underline whitespace-nowrap"
                      >
                        {order.status === 'UNPAID' ? 'Pay' : 'Track'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
