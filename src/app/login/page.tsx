'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [isFirstSetup, setIsFirstSetup] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Cek apakah sudah ada admin di sistem
    fetch('/api/admin/setup/check')
      .then(res => res.json())
      .then(data => setIsFirstSetup(!data.isSetup))
      .catch(() => setIsFirstSetup(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email atau password salah');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/setup/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Super Admin berhasil dibuat! Silakan login.');
        setIsFirstSetup(false);
        // Biarkan email tetap terisi untuk memudahkan login
      } else {
        setError(data.error || 'Gagal melakukan setup');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  if (isFirstSetup === null) return null; // Loading state

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '24px', padding: '3rem 2.5rem', width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '64px', height: '64px', background: isFirstSetup ? '#ecfdf5' : '#fff7ed', borderRadius: '16px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
            fontSize: '2rem'
          }}>
            {isFirstSetup ? '🚀' : '🧡'}
          </div>
          <h1 style={{ color: '#111827', margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {isFirstSetup ? 'System Setup' : 'Welcome Back'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
            {isFirstSetup 
              ? 'Buat akun Super Admin pertama Anda' 
              : 'Masuk ke Dashboard BangParjo'}
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2',
            color: '#ef4444', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', 
            textAlign: 'center', fontWeight: 500
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{ 
            padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0',
            color: '#16a34a', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', 
            textAlign: 'center', fontWeight: 500
          }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={isFirstSetup ? handleSetup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isFirstSetup && (
            <div>
              <label style={labelStyle}>NAMA LENGKAP</label>
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Super Admin"
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>ALAMAT EMAIL</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bangparjo.shop"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>PASSWORD</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>
          <button 
            type="submit" disabled={loading}
            style={{ 
              marginTop: '0.5rem', padding: '1rem', 
              background: isFirstSetup ? '#10b981' : '#f97316', 
              color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              boxShadow: `0 4px 12px ${isFirstSetup ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)'}`
            }}
          >
            {loading ? 'Memproses...' : (isFirstSetup ? 'Selesaikan Setup' : 'Masuk Dashboard')}
          </button>
        </form>

        {!isFirstSetup && (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', marginTop: '2rem' }}>
            Lupa password? Hubungi tim IT BangParjo
          </p>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', color: '#374151', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 600, letterSpacing: '0.05em' };
const inputStyle = { 
  width: '100%', padding: '0.8rem 1rem', background: '#fff',
  border: '1px solid #d1d5db', borderRadius: '12px', color: '#111827', outline: 'none',
  fontSize: '1rem'
};
