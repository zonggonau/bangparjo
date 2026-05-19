'use client';

import { useState, useEffect } from 'react';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cj-proxy?endpoint=/v1/disputes/getDisputeList?pageNum=1&pageSize=20');
      const data = await res.json();
      if (data.success && data.data?.list) setDisputes(data.data.list);
      else if (Array.isArray(data.data)) setDisputes(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleCancel = async (disputeId: string, orderId: string) => {
    if (!confirm('Cancel this dispute?')) return;
    setActionLoading(disputeId);
    try {
      const res = await fetch('/api/cj-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/v1/disputes/cancel',
          method: 'POST',
          data: { disputeId, orderId }
        }),
      });
      const data = await res.json();
      if (data.success || data.result) {
        showToast('Dispute cancelled successfully');
        fetchDisputes();
      } else showToast(data.message || 'Failed to cancel', 'error');
    } catch (e) { showToast('Error cancelling dispute', 'error'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="animate-fade-in">
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i> {toast.message}
        </div>
      )}

      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Dispute Center</h2>
          <p className="text-[#64748B] font-semibold">Manage and resolve supplier disputes directly with CJ.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200" onClick={fetchDisputes} disabled={loading}>
          <i className={`fas fa-sync ${loading ? 'fa-spin' : ''}`}></i> Refresh
        </button>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Dispute ID</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Order ID</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Reason</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Status</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Created</th>
                <th className="text-right px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-[100px]"><i className="fas fa-circle-notch fa-spin fa-2x text-[#FF6B00]"></i></td></tr>
              ) : disputes.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-[100px] text-[#64748B]">
                  <div className="text-[48px] opacity-10 mb-4"><i className="fas fa-shield-alt"></i></div>
                  <p className="font-bold">NO DISPUTES FOUND</p>
                  <p className="text-xs mt-2">All clear! No active disputes with CJ.</p>
                </td></tr>
              ) : disputes.map((d: any) => (
                <tr key={d.disputeId || d.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                  <td className="px-6 py-4 font-extrabold text-sm text-[#1E293B]">#{d.disputeId?.slice(0, 12) || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-[#1E293B]">#{d.orderId?.slice(0, 12) || d.orderNumber?.slice(0, 12) || 'N/A'}</td>
                  <td className="px-6 py-4 text-xs text-[#475569] max-w-[200px] truncate">{d.disputeReason || d.reason || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold uppercase tracking-[0.05em] ${
                      d.status === 1 || d.statusName === 'Pending' ? 'bg-[#FFEDD5] text-[#9A3412]' :
                      d.status === 2 || d.statusName === 'Processing' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                      d.status === 3 || d.statusName === 'Completed' ? 'bg-[#D1FAE5] text-[#065F46]' :
                      d.status === 4 || d.statusName === 'Cancelled' || d.statusName === 'Rejected' ? 'bg-[#FEE2E2] text-[#991B1B]' :
                      'bg-gray-100 text-gray-600'
                    }`}>{d.statusName || `Status ${d.status}`}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-[#64748B]">
                    {d.createTime || d.createdAt ? new Date(d.createTime || d.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {d.status === 1 || d.statusName === 'Pending' ? (
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold border border-[#FEE2E2] text-[#991B1B] hover:bg-red-50 transition-all duration-200"
                        onClick={() => handleCancel(d.disputeId, d.orderId)}
                        disabled={actionLoading === d.disputeId}
                      >
                        <i className={`fas ${actionLoading === d.disputeId ? 'fa-spinner fa-spin' : 'fa-times'}`}></i> Cancel
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
