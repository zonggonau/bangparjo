import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WebhookLogsPage() {
  const logs = await prisma.webhookLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Webhook Logs</h1>
          <p style={{ color: '#71717a', marginTop: '0.25rem' }}>Monitor real-time events from global suppliers.</p>
        </div>
        <Link href="/dashboard" style={{ color: '#09090b', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
              <th style={{ padding: '1rem' }}>Type</th>
              <th style={{ padding: '1rem' }}>Received At</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #e4e4e7' }}>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    background: log.eventType === 'STOCK' ? '#eff6ff' : log.eventType === 'ORDER' ? '#f0fdf4' : '#fff7ed',
                    color: log.eventType === 'STOCK' ? '#1e40af' : log.eventType === 'ORDER' ? '#166534' : '#9a3412',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}>
                    {log.eventType}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#71717a' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  {log.error ? (
                    <span style={{ color: '#dc2626' }}>❌ Error</span>
                  ) : (
                    <span style={{ color: '#16a34a' }}>✅ Success</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <details>
                    <summary style={{ cursor: 'pointer', color: '#2563eb' }}>View Data</summary>
                    <pre style={{ 
                      marginTop: '0.5rem', 
                      background: '#f4f4f5', 
                      padding: '1rem', 
                      borderRadius: '4px', 
                      overflowX: 'auto',
                      fontSize: '0.75rem'
                    }}>
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                    {log.error && (
                      <div style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.75rem' }}>
                        <strong>Error:</strong> {log.error}
                      </div>
                    )}
                  </details>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>
                  No webhook events logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
