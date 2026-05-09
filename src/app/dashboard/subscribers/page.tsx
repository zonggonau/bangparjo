import { prisma } from '@/lib/db';
import SubscriberList from './SubscriberList';

export const dynamic = 'force-dynamic';

export default async function SubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const total = subscribers.length;
  const active = subscribers.filter(s => s.isActive).length;

  return (
    <div>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Subscribers</h1>
          <p style={{ color: '#71717a', marginTop: '0.25rem', fontSize: '0.9rem' }}>Manage your newsletter and email marketing list.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #e4e4e7', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 600 }}>Total</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{total}</div>
          </div>
          <div style={{ background: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #e4e4e7', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 600 }}>Active</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>{active}</div>
          </div>
        </div>
      </header>

      <SubscriberList initialSubscribers={JSON.parse(JSON.stringify(subscribers))} />
    </div>
  );
}
