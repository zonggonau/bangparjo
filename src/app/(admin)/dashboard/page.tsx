import { getDashboardAnalyticsAction } from '@/lib/actions-admin';
import Link from 'next/link';

<<<<<<< HEAD
export default function DashboardPage() {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    totalOrders: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    pendingOrders: number;
    paidOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    lowStockProducts: number;
    topProducts: any[];
    recentOrders: any[];
    dailyRevenue: { date: string; revenue: number; orders: number }[];
  }>({
=======
export default async function DashboardPage() {
  const data = await getDashboardAnalyticsAction();
  
  const analytics = (data.success && data.data) ? data.data : {
>>>>>>> main
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
<<<<<<< HEAD
  });

  useEffect(() => {
    getDashboardAnalyticsAction()
      .then(res => {
        if (res.success) {
          setAnalytics(prev => ({ ...prev, ...res.data }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = analytics.totalRevenue;
  const totalOrders = analytics.totalOrders;
  const totalProfit = analytics.totalProfit;
  const lowStock = analytics.lowStockProducts;

  const recentOrders = analytics.recentOrders || [];
  const dailyRevenue = analytics.dailyRevenue || [];
  const topProducts = analytics.topProducts || [];

=======
  };

  const statCards = [
    { label: 'Total Orders', value: analytics.totalOrders, icon: 'fa-shopping-cart', color: 'text-[#FF6B00]', bg: 'bg-[#FFEDD5]' },
    { label: 'Total Revenue', value: `$${analytics.totalRevenue.toFixed(2)}`, icon: 'fa-dollar-sign', color: 'text-[#10B981]', bg: 'bg-[#D1FAE5]' },
    { label: 'Total Cost', value: `$${analytics.totalCost.toFixed(2)}`, icon: 'fa-chart-line', color: 'text-[#EF4444]', bg: 'bg-[#FEE2E2]' },
    { label: 'Net Profit', value: `$${analytics.totalProfit.toFixed(2)}`, icon: 'fa-hand-holding-usd', color: 'text-[#3B82F6]', bg: 'bg-[#DBEAFE]' },
  ];

>>>>>>> main
  const statusCards = [
    { label: 'Pending', value: analytics.pendingOrders, color: 'bg-[#FFEDD5] text-[#9A3412]', icon: 'fa-clock' },
    { label: 'Paid', value: analytics.paidOrders, color: 'bg-[#D1FAE5] text-[#065F46]', icon: 'fa-check-circle' },
    { label: 'Shipped', value: analytics.shippedOrders, color: 'bg-[#DBEAFE] text-[#1E40AF]', icon: 'fa-shipping-fast' },
    { label: 'Delivered', value: analytics.deliveredOrders, color: 'bg-[#F3E8FF] text-[#7C3AED]', icon: 'fa-home' },
    { label: 'Cancelled', value: analytics.cancelledOrders, color: 'bg-[#FEE2E2] text-[#991B1B]', icon: 'fa-times-circle' },
  ];
<<<<<<< HEAD

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin fa-2x text-[#FF6B00] mb-3"></i>
          <p className="text-sm font-semibold text-[#64748B]">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-black text-[#1E293B] tracking-tight">Dashboard Overview</h2>
          <p className="text-sm font-semibold text-[#64748B]">Welcome back, monitor your CJ Dropshipping business metrics in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-white border border-[#E2E8F0] text-xs font-bold text-[#64748B]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            System Live
          </span>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FF6B00]"></div>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-[12px] bg-[#FFF3E0] text-[#FF6B00] flex items-center justify-center text-xl">
              <i className="fas fa-wallet"></i>
            </div>
            <span className="text-[12px] font-bold text-[#10B981] flex items-center gap-1 bg-[#ECFDF5] px-2.5 py-1 rounded-full">
              <i className="fas fa-arrow-up"></i> Live
            </span>
          </div>
          <div className="mt-5">
            <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Total Revenue</p>
            <h3 className="text-[28px] font-black text-[#1E293B] tracking-tight">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#10B981]"></div>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-[12px] bg-[#ECFDF5] text-[#10B981] flex items-center justify-center text-xl">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <span className="text-[12px] font-bold text-[#10B981] flex items-center gap-1 bg-[#ECFDF5] px-2.5 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="mt-5">
            <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Total Orders</p>
            <h3 className="text-[28px] font-black text-[#1E293B] tracking-tight">{totalOrders}</h3>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#38BDF8]"></div>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-[12px] bg-[#F0F9FF] text-[#38BDF8] flex items-center justify-center text-xl">
              <i className="fas fa-hand-holding-usd"></i>
            </div>
            <span className="text-[12px] font-bold text-[#38BDF8] flex items-center gap-1 bg-[#F0F9FF] px-2.5 py-1 rounded-full">
              Net
            </span>
          </div>
          <div className="mt-5">
            <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Net Profit</p>
            <h3 className="text-[28px] font-black text-[#1E293B] tracking-tight">
              ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className={`absolute top-0 left-0 w-1.5 h-full ${lowStock > 0 ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`}></div>
          <div className="flex justify-between items-start">
            <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-xl ${lowStock > 0 ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#ECFDF5] text-[#10B981]'}`}>
              <i className={`fas ${lowStock > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
            </div>
            {lowStock > 0 ? (
              <span className="text-[10px] font-extrabold text-[#EF4444] bg-[#FEF2F2] px-2.5 py-1 rounded-full animate-pulse">
                Needs Attention
              </span>
            ) : (
              <span className="text-[10px] font-extrabold text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
                All Good
              </span>
            )}
          </div>
          <div className="mt-5">
            <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.05em] mb-1">Low Stock Alerts</p>
            <h3 className="text-[28px] font-black text-[#1E293B] tracking-tight">{lowStock}</h3>
=======

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
>>>>>>> main
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Charts & Status Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden lg:col-span-2 flex flex-col justify-between">
          <div className="px-8 py-6 border-b border-[#E2E8F0] flex items-center justify-between">
=======
      {/* Daily Revenue Chart (simplified) */}
      {analytics.dailyRevenue.length > 0 && (
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
          <div className="px-8 py-5 border-b border-[#E2E8F0]">
>>>>>>> main
            <h3 className="text-lg font-extrabold text-[#1E293B] flex items-center gap-2">
              <i className="fas fa-chart-bar text-[#FF6B00]"></i> Daily Revenue (Last 7 Days)
            </h3>
          </div>
<<<<<<< HEAD
          <div className="p-8 flex-1 flex flex-col justify-end min-h-[220px]">
            {dailyRevenue.length > 0 ? (
              <div className="flex items-end gap-4 h-[180px]">
                {dailyRevenue.map((day: any) => {
                  const maxRev = Math.max(...dailyRevenue.map(d => d.revenue), 1);
                  const height = (day.revenue / maxRev) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="text-[10px] font-bold text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1E293B] text-white px-1.5 py-0.5 rounded-[4px] -translate-y-1">
                        ${day.revenue.toFixed(0)}
                      </div>
                      <div className="w-full bg-[#FFEED5] rounded-t-[6px] relative h-full flex flex-col justify-end">
                        <div className="w-full bg-[#FF6B00] rounded-t-[6px] hover:bg-[#E05E00] transition-colors" style={{ height: `${Math.max(height, 4)}%` }}></div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#94A3B8] mt-1">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-[#64748B] py-10">No revenue data available.</div>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-[#1E293B] flex items-center gap-2 mb-6 text-lg">
              <i className="fas fa-chart-pie text-[#FF6B00]"></i> Order Status
            </h3>
            <div className="space-y-4">
              {statusCards.map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color.split(' ')[0]}`}></span>
                    <span className="text-sm font-semibold text-[#475569]">{s.label}</span>
                  </div>
                  <span className="font-extrabold text-[#1E293B]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-[#E2E8F0] mt-6 flex items-center justify-between">
            <span className="text-sm font-bold text-[#1E293B]">Total Orders</span>
            <span className="font-black text-[#1E293B] text-lg">{analytics.totalOrders}</span>
          </div>
        </div>
      </div>

      {/* Lower Row: Recent Orders, Top Selling & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-[#E2E8F0]">
            <h3 className="text-lg font-extrabold text-[#1E293B] flex items-center gap-2">
              <i className="fas fa-history text-[#FF6B00]"></i> Recent Orders
            </h3>
            <Link href="/dashboard/orders" className="inline-flex items-center gap-2.5 px-4 py-2 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200">
              View All
            </Link>
=======
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
>>>>>>> main
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC]">
<<<<<<< HEAD
                  <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Order ID</th>
                  <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Customer</th>
                  <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Status</th>
                  <th className="text-right px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-[#64748B] font-bold">No orders found.</td>
=======
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
>>>>>>> main
                  </tr>
                ) : (
                  recentOrders.map((o: any) => (
                    <tr key={o.id || o.orderNum} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                      <td className="px-8 py-5 text-sm text-[#1E293B]"><strong>#{o.orderNum?.slice(-8) || o.id?.slice(-8)}</strong></td>
                      <td className="px-8 py-5 text-sm text-[#1E293B]">{o.customerName || 'Anonymous'}</td>
                      <td className="px-8 py-5"><StatusBadge status={o.status} /></td>
                      <td className="px-8 py-5 text-right font-extrabold text-sm text-[#FF6B00]">${Number(o.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
<<<<<<< HEAD

        {/* Sidebar Cards: Top Products & Quick Actions */}
        <div className="space-y-8">
          {/* Top Selling Products */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-[#E2E8F0]">
                <h3 className="text-md font-extrabold text-[#1E293B] flex items-center gap-2">
                  <i className="fas fa-trophy text-[#FF6B00]"></i> Top Selling Products
                </h3>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {topProducts.map((p: any, i: number) => (
                  <div key={p.id || i} className="px-8 py-4 flex items-center gap-4 hover:bg-[#FAFBFE] transition-all duration-200">
                    <span className="text-[10px] font-black text-[#94A3B8] w-5">#{i + 1}</span>
                    {p.image ? (
                      <img src={p.image} alt="" className="w-10 h-10 rounded-[8px] object-cover border border-[#E2E8F0]" />
                    ) : (
                      <div className="w-10 h-10 rounded-[8px] bg-slate-100 flex items-center justify-center text-xs text-[#94A3B8]"><i className="fas fa-image"></i></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-[#1E293B] truncate">{p.name || 'Product'}</p>
                      <p className="text-[11px] text-[#64748B]">{p.quantity || 0} units sold</p>
                    </div>
                    <span className="font-black text-xs text-[#FF6B00]">${(p.revenue || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#E2E8F0]">
              <h3 className="text-md font-extrabold text-[#1E293B]">Quick Actions</h3>
            </div>
            <div className="p-8 flex flex-col gap-3">
              <Link href="/dashboard/inventory" className="inline-flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200 w-full justify-start">
                <i className="fas fa-boxes text-[#FF6B00]"></i> Manage Inventory
              </Link>
              <Link href="/dashboard/tracking" className="inline-flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#10B981] hover:bg-[#F8FAFC] transition-all duration-200 w-full justify-start">
                <i className="fas fa-shipping-fast text-[#10B981]"></i> Order Tracking
              </Link>
              <Link href="/dashboard/balance" className="inline-flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#38BDF8] hover:bg-[#F8FAFC] transition-all duration-200 w-full justify-start">
                <i className="fas fa-wallet text-[#38BDF8]"></i> CJ Balance
              </Link>
              <Link href="/dashboard/settings" className="inline-flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200 w-full justify-start">
                <i className="fas fa-cog text-[#FF6B00]"></i> Store Settings
              </Link>
              <Link href="/" target="_blank" className="inline-flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200 w-full justify-start">
                <i className="fas fa-external-link-alt text-[#FF6B00]"></i> Visit Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || 'PENDING').toUpperCase();
  let className = 'bg-gray-100 text-gray-600';
  if (['PAID', 'DELIVERED', 'COMPLETED'].includes(s)) className = 'bg-[#D1FAE5] text-[#065F46]';
  if (['PENDING', 'UNPAID', 'PROCESSING'].includes(s)) className = 'bg-[#FFEDD5] text-[#9A3412]';
  if (['CANCELLED', 'FAILED'].includes(s)) className = 'bg-[#FEE2E2] text-[#991B1B]';

  return <span className={`inline-flex items-center px-3.5 py-1.5 rounded-[8px] text-[11px] font-extrabold uppercase tracking-[0.05em] ${className}`}>{s}</span>;
}

=======
      )}
    </div>
  );
}
>>>>>>> main
