import { getDisputeList } from '@/lib/cj-api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Support Center</h1>
        <p style={{ color: '#71717a', marginTop: '0.25rem', fontSize: '0.9rem' }}>Track customer inquiries and CJ Dropshipping disputes.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Customer Tickets Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Customer Inquiries</h2>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Latest {tickets.length} tickets</span>
          </div>
          <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', background: 'white', overflow: 'hidden' }}>
            {tickets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tickets.map((t: any) => (
                  <div key={t.id} style={{ padding: '1rem', borderBottom: '1px solid #f4f4f5', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.subject}</span>
                      <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#3f3f46', margin: '0 0 0.5rem 0' }}>{t.message.substring(0, 100)}{t.message.length > 100 ? '...' : ''}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>From: {t.name} ({t.email})</span>
                      <span style={{ 
                        fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                        background: t.status === 'OPEN' ? '#fef2f2' : '#f0fdf4',
                        color: t.status === 'OPEN' ? '#dc2626' : '#16a34a'
                      }}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#71717a', fontSize: '0.85rem' }}>No customer tickets yet.</div>
            )}
          </div>
        </section>

        {/* CJ Disputes Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>CJ Disputes</h2>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Linked to CJ Orders</span>
          </div>
          <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', background: 'white', overflow: 'hidden' }}>
            {disputes.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                    <th style={thStyle}>ORDER ID</th>
                    <th style={thStyle}>REASON</th>
                    <th style={thStyle}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((d: any) => (
                    <tr key={d.disputeId} style={{ borderBottom: '1px solid #f4f4f5' }}>
                      <td style={tdStyle}>{d.orderId}</td>
                      <td style={tdStyle}>{d.disputeReason}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#f4f4f5', fontWeight: 600 }}>{d.statusName}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#71717a', fontSize: '0.85rem' }}>No CJ disputes found.</div>
            )}
          </div>
          <div style={{ marginTop: '1.5rem', background: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#1e40af' }}>💡 Tips Dispute</h4>
            <p style={{ fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.4, margin: 0 }}>
              Selalu sertakan foto label pengiriman dan kondisi produk yang rusak saat membuka dispute di CJ untuk mempercepat proses refund.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

const thStyle = { padding: '0.75rem 1rem', fontWeight: 600, color: '#71717a' };
const tdStyle = { padding: '0.75rem 1rem' };
