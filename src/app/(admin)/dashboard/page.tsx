import { getDashboardAnalyticsAction } from '@/lib/actions-admin';
import Link from 'next/link';

export default async function DashboardPage() {
  const data = await getDashboardAnalyticsAction();
  
  const analytics = (data.success && data.data) ? data.data : {
    totalOrders: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    pendingOrders: 0,
    paidOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    lowStockProducts: 0,
    topProducts: [],
    recentOrders: [],
    dailyRevenue: [],
  };

  const statCards = [
    { label: 'Total Orders', value: analytics.totalOrders, icon: 'fa-shopping-cart', color: 'text-[#FF6B00]', bg: 'bg-[#FFEDD5]' },
    { label: 'Total Revenue', value: `$${analytics.totalRevenue.toFixed(2)}`, icon: 'fa-dollar-sign', color: 'text-[#10B981]', bg: 'bg-[#D1FAE5]' },
    { label: 'Total Cost', value: `$${analytics.totalCost.toFixed(2)}`, icon: 'fa-chart-line', color: 'text-[#EF4444]', bg: 'bg-[#FEE2E2]' },
    { label: 'Net Profit', value: `$${analytics.totalProfit.toFixed(2)}`, icon: 'fa-hand-holding-usd', color: 'text-[#3B82F6]', bg: 'bg-[#DBEAFE]' },
  ];

  const statusCards = [
    { label: 'Pending', value: analytics.pendingOrders, color: 'bg-[#FFEDD5] text-[#9A3412]', icon: 'fa-clock' },
    { label: 'Paid', value: analytics.paidOrders, color: 'bg-[#D1FAE5] text-[#065F46]', icon: 'fa-check-circle' },
    { label: 'Shipped', value: analytics.shippedOrders, color: 'bg-[#DBEAFE] text-[#1E40AF]', icon: 'fa-shipping-fast' },
    { label: 'Delivered', value: analytics.deliveredOrders, color: 'bg-[#F3E8FF] text-[#7C3AED]', icon: 'fa-home' },
    { label: 'Cancelled', value: analytics.cancelledOrders, color: 'bg-[#FEE2E2] text-[#991B1B]', icon: 'fa-times-circle' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Analytics Dashboard</h2>
        <p className="text-[#64748B] font-semibold">Overview of your store's performance and metrics.</p>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em]">{card.label}</p>
              <div className={`w-10 h-10 rounded-[10px] ${card.bg} flex items-center justify-center`}>
                <i className={`fas ${card.icon} ${card.color}`}></i>
              </div>
            </div>
            <h3 className="text-[28px] font-black text-[#1E293B]">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-6">
          <h3 className="font-extrabold text-[#1E293B] flex items-center gap-2 mb-6">
            <i className="fas fa-chart-pie text-[#FF6B00]"></i> Order Status
          </h3>
          <div className="space-y-4">
            {statusCards.map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.color.split(' ')[0]}`}></div>
                  <span className="text-sm font-semibold text-[#475569]">{s.label}</span>
                </div>
                <span className="font-extrabold text-[#1E293B]">{s.value}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <span className="text-sm font-bold text-[#1E293B]">Total</span>
              <span className="font-black text-[#1E293B] text-lg">{analytics.totalOrders}</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-6">
          <h3 className="font-extrabold text-[#1E293B] flex items-center gap-2 mb-4">
            <i className="fas fa-exclamation-triangle text-[#FF6B00]"></i> Inventory
          </h3>
          {analytics.lowStockProducts > 0 ? (
            <div className="bg-[#FFEDD5] rounded-[12px] p-5 border border-[#FED7AA]">
              <div className="text-[36px] font-black text-[#9A3412]">{analytics.lowStockProducts}</div>
              <p className="font-bold text-sm text-[#9A3412] mt-1">Low stock products</p>
              <p className="text-xs text-[#C2410C] mt-2">These products need restocking soon.</p>
            </div>
          ) : (
            <div className="bg-[#D1FAE5] rounded-[12px] p-5 border border-[#A7F3D0]">
              <div className="text-[36px] font-black text-[#065F46]">0</div>
              <p className="font-bold text-sm text-[#065F46] mt-1">All stocked up!</p>
              <p className="text-xs text-[#047857] mt-2">No low stock alerts.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-6">
          <h3 className="font-extrabold text-[#1E293B] flex items-center gap-2 mb-4">
            <i className="fas fa-bolt text-[#FF6B00]"></i> Quick Actions
          </h3>
          <div className="space-y-3">
            <Link href="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-[#F8FAFC] hover:bg-[#FFEDD5] transition-all duration-200 no-underline group">
              <div className="w-8 h-8 rounded-[8px] bg-[#DBEAFE] flex items-center justify-center text-[#3B82F6] group-hover:bg-[#BFDBFE] transition-all">
                <i className="fas fa-list"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-[#1E293B]">View All Orders</p>
                <p className="text-xs text-[#64748B]">{analytics.totalOrders} orders total</p>
              </div>
            </Link>
            <Link href="/dashboard/myproducts" className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-[#F8FAFC] hover:bg-[#FFEDD5] transition-all duration-200 no-underline group">
              <div className="w-8 h-8 rounded-[8px] bg-[#D1FAE5] flex items-center justify-center text-[#10B981] group-hover:bg-[#A7F3D0] transition-all">
                <i className="fas fa-box"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-[#1E293B]">Manage Products</p>
                <p className="text-xs text-[#64748B]">Import & manage inventory</p>
              </div>
            </Link>
            <Link href="/dashboard/importer" className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-[#F8FAFC] hover:bg-[#FFEDD5] transition-all duration-200 no-underline group">
              <div className="w-8 h-8 rounded-[8px] bg-[#FEF3C7] flex items-center justify-center text-[#F59E0B] group-hover:bg-[#FDE68A] transition-all">
                <i className="fas fa-download"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-[#1E293B]">Import Products</p>
                <p className="text-xs text-[#64748B]">Import from CJ Dropshipping</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart (simplified) */}
      {analytics.dailyRevenue.length > 0 && (
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
          <div className="px-8 py-5 border-b border-[#E2E8F0]">
            <h3 className="text-lg font-extrabold text-[#1E293B] flex items-center gap-2">
              <i className="fas fa-chart-bar text-[#FF6B00]"></i> Daily Revenue (Last 7 Days)
            </h3>
          </div>
          <div className="p-8">
            <div className="flex items-end gap-3 h-[200px]">
              {analytics.dailyRevenue.map((day: any) => {
                const maxRev = Math.max(...analytics.dailyRevenue.map((d: any) => d.revenue), 1);
                const height = (day.revenue / maxRev) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-[#64748B]">${day.revenue.toFixed(0)}</span>
                    <div className="w-full bg-[#FFEDD5] rounded-t-[6px] relative" style={{ height: `${Math.max(height, 4)}%` }}>
                      <div className="absolute inset-0 bg-[#FF6B00] rounded-t-[6px] opacity-60"></div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#94A3B8]">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                    <span className="text-[9px] text-[#94A3B8]">{day.orders} orders</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Products */}
      {analytics.topProducts.length > 0 && (
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
          <div className="px-8 py-5 border-b border-[#E2E8F0]">
            <h3 className="text-lg font-extrabold text-[#1E293B] flex items-center gap-2">
              <i className="fas fa-trophy text-[#FF6B00]"></i> Top Selling Products
            </h3>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {analytics.topProducts.map((p: any, i: number) => (
              <div key={p.id || i} className="px-8 py-4 flex items-center gap-4 hover:bg-[#FAFBFE] transition-all duration-200">
                <span className="text-[10px] font-black text-[#94A3B8] w-5">#{i + 1}</span>
                {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-[8px] object-cover border border-[#E2E8F0]" />}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#1E293B] truncate">{p.name || 'Product'}</p>
                  <p className="text-xs text-[#64748B]">{p.quantity || 0} units sold</p>
                </div>
                <span className="font-black text-sm text-[#FF6B00]">${(p.revenue || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {analytics.recentOrders.length > 0 && (
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[#1E293B] flex items-center gap-2">
              <i className="fas fa-history text-[#FF6B00]"></i> Recent Orders
            </h3>
            <Link href="/dashboard/orders" className="text-sm font-bold text-[#FF6B00] no-underline hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <th className="text-left px-6 py-3 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Order</th>
                  <th className="text-left px-6 py-3 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Customer</th>
                  <th className="text-left px-6 py-3 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Total</th>
                  <th className="text-left px-6 py-3 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Status</th>
                  <th className="text-left px-6 py-3 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentOrders.map((o: any) => (
                  <tr key={o.id || o.orderNum} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                    <td className="px-6 py-4 font-bold text-sm text-[#1E293B]">#{o.orderNum?.slice(0, 12)}</td>
                    <td className="px-6 py-4 text-sm text-[#475569]">{o.customerName || o.customerEmail}</td>
                    <td className="px-6 py-4 font-bold text-sm text-[#FF6B00]">${(o.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold ${
                        ['PAID', 'DELIVERED'].includes(o.status?.toUpperCase()) ? 'bg-[#D1FAE5] text-[#065F46]' :
                        o.status?.toUpperCase() === 'SHIPPED' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                        o.status?.toUpperCase() === 'UNPAID' ? 'bg-[#FFEDD5] text-[#9A3412]' :
                        'bg-gray-100 text-gray-600'
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#64748B]">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
