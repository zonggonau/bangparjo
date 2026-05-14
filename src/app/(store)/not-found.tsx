import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🔍</div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Page Not Found 🔍</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '2.5rem', lineHeight: '1.6' }}>
        Looks like this trend went cold — the page you&apos;re looking for doesn&apos;t exist.
        Let&apos;s get you back to what&apos;s hot!
      </p>
      <Link
        href="/"
        style={{
          background: 'var(--primary)',
          color: 'white',
          padding: '1rem 2.5rem',
          borderRadius: 'var(--radius-full)',
          fontWeight: '700',
          fontSize: '1.1rem',
          transition: 'transform 0.2s'
        }}
      >
        🔥 Back to Trending
      </Link>
    </div>
  );
}
