'use client';

import { useState, useEffect } from 'react';

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/webhooks'); 
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg transition-all duration-300 ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
          {toast.message}
        </div>
      )}

      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Signal Monitor</h2>
          <p className="text-[#64748B] font-semibold">Monitor real-time data transmissions and background sync events.</p>
        </div>
        <button className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[12px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200" onClick={fetchLogs} disabled={loading}>
          <i className={`fas fa-sync ${loading ? 'fa-spin' : ''}`}></i> Refresh Feed
        </button>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Packet Type</th>
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Timestamp</th>
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">State</th>
                <th className="text-left px-8 py-[18px] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Data Inspection</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={4} className="text-center py-[100px]"><i className="fas fa-circle-notch fa-spin fa-2x text-[#FF6B00]"></i></td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-[100px] text-[#64748B]">
                    <div className="text-[48px] opacity-10 mb-4"><i className="fas fa-terminal"></i></div>
                    <p className="font-bold">NO TRANSMISSIONS FOUND</p>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                    <td className="px-8 py-5">
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold uppercase tracking-[0.05em] ${
                         log.eventType === 'STOCK' ? 'bg-[#DBEAFE] text-[#1E40AF]' : 
                         log.eventType === 'ORDER' ? 'bg-[#FFEDD5] text-[#9A3412]' : 
                         'bg-gray-100 text-gray-600'
                       }`}>
                         {log.eventType}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <span className="text-xs font-bold text-[#64748B]">
                         {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       {log.error ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold bg-[#FEE2E2] text-[#991B1B] uppercase tracking-[0.05em]">
                           <i className="fas fa-times-circle"></i> Error
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold bg-[#D1FAE5] text-[#065F46] uppercase tracking-[0.05em]">
                           <i className="fas fa-check-circle"></i> Valid
                         </span>
                       )}
                    </td>
                    <td className="px-8 py-5">
                       <details className="w-full">
                         <summary className="cursor-pointer text-[11px] text-[#FF6B00] font-extrabold uppercase tracking-[0.05em]">
                           <i className="far fa-eye"></i> Inspect Payload
                         </summary>
                         <div className="mt-4 animate-fade-in">
                           <pre className="p-6 bg-[#0F172A] text-[#38BDF8] rounded-[12px] text-[13px] border border-[#1E293B] max-h-[400px] overflow-auto font-mono leading-[1.6] shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                             {JSON.stringify(log.payload, null, 2)}
                           </pre>
                           {log.error && (
                             <div className="mt-3 p-4 bg-[#FEF2F2] text-[#EF4444] text-[13px] rounded-[10px] border border-[#FEE2E2] font-bold">
                               <i className="fas fa-exclamation-triangle"></i> {log.error}
                             </div>
                           )}
                         </div>
                       </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
