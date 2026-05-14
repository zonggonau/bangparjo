'use client';

import { useState } from 'react';

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date | string;
}

export default function SubscriberList({ initialSubscribers }: { initialSubscribers: Subscriber[] }) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscriber?')) return;
    
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubscribers(subscribers.filter(s => s.id !== id));
      }
    } catch (err) {
      alert('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Email', 'Joined Date', 'Status'],
      ...subscribers.map(s => [s.email, new Date(s.createdAt).toISOString(), s.isActive ? 'Active' : 'Inactive'])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', color: '#71717a' }}>{subscribers.length} total subscribers</span>
        <button 
          onClick={handleExport}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e4e4e7', background: 'white', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
        >
          📥 Export CSV
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#71717a' }}>EMAIL</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#71717a' }}>JOINED DATE</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#71717a' }}>STATUS</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#71717a', textAlign: 'right' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((sub) => (
            <tr key={sub.id} style={{ borderBottom: '1px solid #e4e4e7' }}>
              <td style={{ padding: '1rem', fontWeight: 500 }}>{sub.email}</td>
              <td style={{ padding: '1rem', color: '#71717a' }}>
                {new Date(sub.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </td>
              <td style={{ padding: '1rem' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: sub.isActive ? '#f0fdf4' : '#f4f4f5',
                  color: sub.isActive ? '#16a34a' : '#71717a',
                  border: `1px solid ${sub.isActive ? '#bbf7d0' : '#e4e4e7'}`
                }}>
                  {sub.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <button 
                  onClick={() => handleDelete(sub.id)}
                  disabled={deleting === sub.id}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  {deleting === sub.id ? 'Deleting...' : 'Remove'}
                </button>
              </td>
            </tr>
          ))}
          {subscribers.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>
                No subscribers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
