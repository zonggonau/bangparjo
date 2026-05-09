'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>⚠️</div>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>Something went wrong!</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', marginBottom: '2rem', lineHeight: '1.6' }}>
        We apologize for the inconvenience. Our global systems might be experiencing a temporary hiccup.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => reset()}
          style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '0.875rem 1.75rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: '700',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            padding: '0.875rem 1.75rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: '700',
            border: '1px solid var(--border)'
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
