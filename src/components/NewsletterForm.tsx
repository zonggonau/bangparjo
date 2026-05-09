'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: 'Terima kasih telah berlangganan!' });
        setEmail('');
      } else {
        setStatus({ type: 'error', msg: data.error || 'Gagal berlangganan' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Terjadi kesalahan sistem' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="email" 
          placeholder="your@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '0.6rem 0.8rem',
            borderRadius: '6px',
            border: '1px solid #e4e4e7',
            fontSize: '0.875rem',
            outline: 'none',
            background: 'white'
          }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{
            background: '#18181b',
            color: 'white',
            border: 'none',
            padding: '0.6rem 1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '...' : 'Join'}
        </button>
      </form>
      {status && (
        <p style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.75rem', 
          color: status.type === 'success' ? '#16a34a' : '#ef4444' 
        }}>
          {status.msg}
        </p>
      )}
    </div>
  );
}
