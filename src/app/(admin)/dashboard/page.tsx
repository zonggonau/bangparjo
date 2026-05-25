'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';
import { getDashboardAnalyticsAction } from '@/lib/actions-admin';

export default function DashboardPage() {
  const { settings } = useSettings();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardAnalyticsAction()
      .then(res => { 
        if (res.success) {
          setAnalytics(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = analytics?.totalRevenue || 0;
  const totalOrders = analytics?.totalOrders || 0;
  const totalCustomers = new Set((analytics?.recentOrders || []).map((o: any) => o.customerEmail)).size; // Approximate for dashboard
  const avgRating = 4.8;

  const recentOrders = analytics?.recentOrders || [];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6B00]"></div>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-[12px] bg-[#FFF3E0] text-[#FF6B00] flex items-center justify-center text-xl">
              <i className="fas fa-wallet"></i>
            </div>
            <div className="text-[12px] font-bold text-[#10B981] flex items-center gap-1">
              <i className="fas fa-arrow-up"></i> 12%
            </div>
          </div>
          <div className="mt-5">
            <p className="text-[13px] font-bold text-[#64748B] uppercase tracking-[0.05em] mb-2">Total Revenue</p>
            <h3 className="text-[32px] font-black text-[#1E293B] tracking-[-0.03em]">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]"></div>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-[12px] bg-[#ECFDF5] text-[#10B981] flex items-center justify-center text-xl">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="text-[12px] font-bold text-[#10B981] flex items-center gap-1">
              <i className="fas fa-arrow-up"></i> 8%
            </div>
          </div>
          <div className="mt-5">
            <p className="text-[13px] font-bold text-[#64748B] uppercase tracking-[0.05em] mb-2">Total Orders</p>
            <h3 className="text-[32px] font-black text-[#1E293B] tracking-[-0.03em]">{totalOrders}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#38BDF8]"></div>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-[12px] bg-[#F0F9FF] text-[#38BDF8] flex items-center justify-center text-xl">
              <i className="fas fa-users"></i>
            </div>
            <div className="text-[12px] font-bold text-[#10B981] flex items-center gap-1">
              <i className="fas fa-arrow-up"></i> 15%
            </div>
          </div>
          <div className="mt-5">
            <p className="text-[13px] font-bold text-[#64748B] uppercase tracking-[0.05em] mb-2">Total Customers</p>
            <h3 className="text-[32px] font-black text-[#1E293B] tracking-[-0.03em]">{totalCustomers}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#EF4444]"></div>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-[12px] bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center text-xl">
              <i className="fas fa-star"></i>
            </div>
            <div className="text-[12px] font-bold text-[#10B981] flex items-center gap-1">
              <i className="fas fa-arrow-up"></i> 0.3
            </div>
          </div>
          <div className="mt-5">
            <p className="text-[13px] font-bold text-[#64748B] uppercase tracking-[0.05em] mb-2">Avg. Rating</p>
            <h3 className="text-[32px] font-black text-[#1E293B] tracking-[-0.03em]">{avgRating}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-[#E2E8F0]">
            <h3 className="text-lg font-extrabold text-[#1E293B]">Recent Orders</h3>
            <Link href="/dashboard/orders" className="inline-flex items-center gap-2.5 px-4 py-2 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Order</th>
                  <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Customer</th>
                  <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Status</th>
                  <th className="text-right px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-20"><i className="fas fa-spinner fa-spin text-[#FF6B00]"></i></td></tr>
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-20 text-[#64748B] font-bold">No orders found.</td></tr>
                ) : recentOrders.map((o: any) => (
                  <tr key={o.id || o.orderNum} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                    <td className="px-8 py-5 text-sm text-[#1E293B]"><strong>#{o.orderNum.slice(-8)}</strong></td>
                    <td className="px-8 py-5 text-sm text-[#1E293B]">{o.customerName || 'Anonymous'}</td>
                    <td className="px-8 py-5"><StatusBadge status={o.status} /></td>
                    <td className="px-8 py-5 text-right font-extrabold text-sm">${Number(o.totalAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-[#E2E8F0]">
            <h3 className="text-lg font-extrabold text-[#1E293B]">Quick Actions</h3>
          </div>
          <div className="p-8 flex flex-col gap-3">
            <Link href="/dashboard/importer" className="inline-flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200 w-full justify-start">
              <i className="fas fa-plus-circle text-[#FF6B00]"></i> Import New Products
            </Link>
            <Link href="/dashboard/inventory" className="inline-flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200 w-full justify-start">
              <i className="fas fa-boxes text-[#FF6B00]"></i> Manage Inventory
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
