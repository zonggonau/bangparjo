import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getWishlistAction } from '@/lib/actions';
import { getCustomerOrdersAction } from '@/lib/actions-user';

export const metadata = {
  title: 'My Dashboard - Account',
};

function formatUSD(price: number | string | null | undefined) {
  const p = typeof price === 'string' ? parseFloat(price) : (price || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
}

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'UNKNOWN').toUpperCase();
  let badgeClass = 'bg-gray-100/50 text-gray-600 border-gray-200';
  let icon = 'fas fa-circle-notch';
  
  if (['PAID', 'DELIVERED', 'COMPLETED'].includes(s)) {
    badgeClass = 'bg-green-100/50 text-green-700 border-green-200';
    icon = 'fas fa-check-circle';
  }
  if (['PENDING', 'UNPAID', 'PROCESSING'].includes(s)) {
    badgeClass = 'bg-orange-100/50 text-[#FF6B00] border-orange-200';
    icon = 'fas fa-clock';
  }
  if (['CANCELLED', 'FAILED'].includes(s)) {
    badgeClass = 'bg-red-100/50 text-red-600 border-red-200';
    icon = 'fas fa-times-circle';
  }
  if (['SHIPPED'].includes(s)) {
    badgeClass = 'bg-blue-100/50 text-blue-700 border-blue-200';
    icon = 'fas fa-truck-fast';
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border backdrop-blur-md ${badgeClass}`}>
      <i className={`${icon} text-[10px]`}></i>
      {s}
    </span>
  );
}

export default async function AccountDashboard() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Fetch data in parallel
  const [ordersRes, wishlistRes] = await Promise.all([
    getCustomerOrdersAction(session.user.email),
    getWishlistAction()
  ]);

  const orders = (ordersRes.success && ordersRes.data) ? ordersRes.data : [];
  const wishlistCount = (wishlistRes.success && Array.isArray(wishlistRes.data)) ? wishlistRes.data.length : 0;

  const stats = {
    total: orders.length,
    paid: orders.filter((o: any) => ['PAID', 'DELIVERED', 'SHIPPED', 'COMPLETED'].includes((o.status || '').toUpperCase())).length,
    unpaid: orders.filter((o: any) => ['UNPAID', 'PENDING'].includes((o.status || '').toUpperCase())).length
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
          Welcome back, <span className="text-[#FF6B00]">{session.user.name?.split(' ')[0] || 'Member'}!</span>
        </h2>
      </div>
      
      {/* Modern Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-orange-50 to-orange-100/30 p-6 border border-orange-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 text-orange-200/50 group-hover:text-orange-200 transition-colors duration-300">
            <i className="fas fa-box-open text-8xl transform -rotate-12"></i>
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#FF6B00] mb-4">
              <i className="fas fa-shopping-bag text-lg"></i>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Total Orders</p>
            <h3 className="text-3xl sm:text-4xl font-black text-[#1A1A1A]">{stats.total}</h3>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-green-50 to-green-100/30 p-6 border border-green-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 text-green-200/50 group-hover:text-green-200 transition-colors duration-300">
            <i className="fas fa-check-circle text-8xl transform rotate-12"></i>
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-green-500 mb-4">
              <i className="fas fa-award text-lg"></i>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Completed</p>
            <h3 className="text-3xl sm:text-4xl font-black text-[#1A1A1A]">{stats.paid}</h3>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-red-50 to-red-100/30 p-6 border border-red-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 text-red-200/50 group-hover:text-red-200 transition-colors duration-300">
            <i className="fas fa-heart text-8xl transform -rotate-6"></i>
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-red-500 mb-4">
              <i className="fas fa-bookmark text-lg"></i>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Wishlist Items</p>
            <h3 className="text-3xl sm:text-4xl font-black text-[#1A1A1A]">{wishlistCount}</h3>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between mb-5">
        <div>
          <h3 className="text-xl font-bold text-[#1A1A1A]">Recent Activity</h3>
          <p className="text-sm text-gray-500 mt-1">Track and manage your latest orders</p>
        </div>
        {orders.length > 0 && (
          <Link href="/account/orders" className="text-sm font-bold text-[#FF6B00] bg-orange-50 px-4 py-2 rounded-full hover:bg-orange-100 transition-colors no-underline">
            View All <i className="fas fa-arrow-right ml-1"></i>
          </Link>
        )}
      </div>

      {orders.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {orders.slice(0, 5).map((order: any, idx: number) => {
            const isUnpaid = (order.status || '').toUpperCase() === 'UNPAID';
            const itemPreview = order.items?.[0]?.variant?.product?.images?.[0];
            const remainingItems = (order.items?.length || 1) - 1;

            return (
              <div 
                key={order.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white/80 backdrop-blur-md rounded-[16px] border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="relative shrink-0">
                    {itemPreview ? (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[12px] overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={itemPreview} alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[12px] border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400">
                        <i className="fas fa-box text-xl"></i>
                      </div>
                    )}
                    {remainingItems > 0 && (
                      <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
                        +{remainingItems}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <Link href={isUnpaid ? `/checkout/${order.orderNum}?id=${order.checkoutToken}` : `/track?orderNum=${order.orderNum}`} className="text-base font-bold text-[#1A1A1A] hover:text-[#FF6B00] no-underline transition-colors flex items-center gap-2">
                      #{order.orderNum.slice(0, 8)}...
                      <i className="fas fa-external-link-alt text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </Link>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <i className="far fa-calendar-alt"></i> {formatDate(order.createdAt)}
                    </p>
                    <div className="mt-2 sm:hidden"><StatusBadge status={order.status} /></div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                  <div className="hidden sm:block">
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Total Amount</p>
                    <p className="text-base font-black text-[#1A1A1A]">{formatUSD(order.totalAmount)}</p>
                  </div>
                  <div className="shrink-0">
                    <Link
                      href={isUnpaid ? `/checkout/${order.orderNum}?id=${order.checkoutToken}` : `/track?orderNum=${order.orderNum}`}
                      className={`inline-flex items-center justify-center px-4 py-2.5 rounded-[10px] text-sm font-bold shadow-sm transition-all duration-200 no-underline whitespace-nowrap ${
                        isUnpaid 
                          ? 'bg-[#FF6B00] text-white hover:bg-[#E06000] hover:shadow-md hover:-translate-y-0.5' 
                          : 'bg-white text-[#1A1A1A] border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {isUnpaid ? (
                        <><i className="fas fa-credit-card mr-2"></i> Pay Now</>
                      ) : (
                        <><i className="fas fa-map-location-dot mr-2"></i> Track</>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gradient-to-b from-gray-50 to-white border border-dashed border-gray-300 rounded-[24px] py-16 px-6 text-center shadow-inner">
          <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-md">
            <i className="fas fa-shopping-cart text-4xl text-gray-300"></i>
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't made your first purchase. Discover our amazing products!</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 no-underline"
          >
            Start Shopping <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      )}
    </div>
  );
}
