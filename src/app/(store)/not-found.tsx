import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      background: '#07070e',
      color: '#f0f0f6',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🔍</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', color: '#f0f0f6' }}>
        Page Not Found
      </h1>
      <p style={{ color: '#6b7280', maxWidth: '360px', marginBottom: '2rem', lineHeight: 1.7 }}>
        This page doesn&apos;t exist. You can track your order or discover products on our social media.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/track" style={{
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          color: '#fff',
          padding: '0.75rem 1.75rem',
          borderRadius: '0.75rem',
          fontWeight: 700,
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}>
          📦 Track My Order
        </Link>
        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#d1d5db',
          padding: '0.75rem 1.75rem',
          borderRadius: '0.75rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}>
          🔥 See Products
        </a>
      </div>
    </div>
  );
}
