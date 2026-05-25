import { getDisputeList } from '@/lib/cj-api';
import { prisma } from '@/lib/db';

export default async function SupportPage() {
  // 1. Fetch CJ Disputes
  const res = await getDisputeList({ pageNum: 1, pageSize: 10 });
  const disputes = res.success && res.data ? res.data.list || [] : [];

  // 2. Fetch Local Customer Tickets
  let tickets: any[] = [];
  try {
    tickets = await (prisma as any).supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  } catch {
    tickets = await prisma.$queryRaw`SELECT * FROM "SupportTicket" ORDER BY "createdAt" DESC LIMIT 20`;
  }

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Support Center</h2>
        <p className="text-[#64748B] font-semibold">Manage customer inquiries and supplier disputes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Customer Tickets */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-8 py-6 border-b border-[#E2E8F0]">
            <i className="fas fa-headset text-[#FF6B00]"></i>
            <h3 className="text-lg font-extrabold text-[#1E293B]">Customer Inquiries</h3>
          </div>
          <div>
            {tickets.length > 0 ? (
              tickets.map((t: any) => (
                <div key={t.id} className="p-6 border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-sm text-[#1E293B]">{t.subject}</strong>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold uppercase tracking-[0.05em] ${t.status === 'OPEN' ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#D1FAE5] text-[#065F46]'}`}>{t.status}</span>
                  </div>
                  <div className="text-xs text-[#64748B] mb-3">
                    <i className="fas fa-user"></i> {t.name} • <i className="fas fa-clock"></i> {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                  <p className="text-[13px] text-[#475569] mb-3">{t.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#94A3B8]">{t.email}</span>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200">
                      Reply <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-[60px] text-[#94A3B8]">
                <i className="fas fa-comment-slash text-[40px] mb-4"></i>
                <p>No active tickets.</p>
              </div>
            )}
          </div>
        </div>

        {/* Supplier Disputes */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-8 py-6 border-b border-[#E2E8F0]">
            <i className="fas fa-gavel text-[#FF6B00]"></i>
            <h3 className="text-lg font-extrabold text-[#1E293B]">Supplier Disputes (CJ)</h3>
          </div>
          <div>
            {disputes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC]">
                      <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Order</th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Reason</th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((d: any) => (
                      <tr key={d.disputeId} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-all duration-200">
                        <td className="px-6 py-4 text-sm font-bold text-[#1E293B]">#{d.orderId}</td>
                        <td className="px-6 py-4 text-xs text-[#475569]">{d.disputeReason}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold bg-gray-100 text-gray-600 uppercase tracking-[0.05em]">{d.statusName}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-[60px] text-[#94A3B8]">
                <i className="fas fa-shield-alt text-[40px] mb-4"></i>
                <p>No active disputes.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
