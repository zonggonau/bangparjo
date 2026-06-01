'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SetupForm({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create admin.');
      } else {
        // Auto-login after setup
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (result?.error) {
          setError('Admin created but login failed. Please sign in manually.');
        } else {
          onComplete();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="max-w-[440px] w-full bg-white rounded-[24px] p-12 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        <div className="text-center mb-8">
          <Link href="/" className="text-[32px] font-black text-[#1A1A1A] mb-4 block no-underline">
            Bang<span className="text-[#FF6B00]">Parjo</span>
          </Link>
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-[22px] font-black text-[#1A1A1A] mb-2">Welcome! Set Up Your Store</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Create your super admin account to get started.
          </p>
        </div>

        <form onSubmit={handleSetup}>
          <div className="mb-5">
            <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-[12px] border border-gray-200 text-base outline-none focus:border-[#FF6B00]"
              autoFocus
            />
          </div>

          <div className="mb-5">
            <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Email Address</label>
            <input
              type="email"
              placeholder="admin@bangparjo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-[12px] border border-gray-200 text-base outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div className="mb-5">
            <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-[12px] border border-gray-200 text-base outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div className="mb-6">
            <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat your password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-[12px] border border-gray-200 text-base outline-none focus:border-[#FF6B00]"
            />
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-[10px] text-sm font-semibold">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-4 rounded-md text-base font-black bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 disabled:opacity-50"
            disabled={loading || !name || !email || !password || !confirmPassword}
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Create Super Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/account';
  
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [checkingSession, setCheckingSession] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // ── Check session & setup status ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        // 1. Check if already logged in
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();

        if (session?.user) {
          if (session.user.role === 'ADMIN') {
            router.push('/dashboard');
          } else {
            router.push(callbackUrl);
          }
          return;
        }

        // 2. Check if setup is needed (no admin users exist)
        const setupRes = await fetch('/api/admin/setup/check');
        const setup = await setupRes.json();

        if (!cancelled) {
          if (setup.isSetup === false) {
            setNeedsSetup(true);
          }
          setCheckingSession(false);
        }
      } catch {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    };

    check();
    return () => { cancelled = true; };
  }, [router, callbackUrl]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send code.');
      } else {
        setStep('otp');
        setCountdown(600);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (data.success && data.sessionToken) {
        // Use the one-time session token as the "password" — auth.ts validates it
        const result = await signIn('credentials', {
          email: data.email,
          password: data.sessionToken,
          redirect: false,
        });

        if (result?.error) {
          setError('Login failed. Please try again.');
        } else {
          const sessionRes = await fetch('/api/auth/session');
          const session = await sessionRes.json();
          
          if (session?.user?.role === 'ADMIN') {
            router.push('/dashboard');
          } else {
            router.push(callbackUrl);
          }
          router.refresh();
        }
      } else {
        setError('Verification response was invalid. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setCode(['', '', '', '', '', '']);
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setCountdown(600);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep('email');
    setCode(['', '', '', '', '', '']);
    setError('');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password.');
      } else {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        if (session?.user?.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/account');
        }
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Show loading while checking session ─────────────────────────────────
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-circle-notch fa-spin fa-2x text-[#FF6B00]"></i>
      </div>
    );
  }

  // ── Show setup form if no admin exists ──────────────────────────────────
  if (needsSetup) {
    return <SetupForm onComplete={() => router.push('/dashboard')} />;
  }

  const switchMode = () => {
    setMode(mode === 'customer' ? 'admin' : 'customer');
    setStep('email');
    setCode(['', '', '', '', '', '']);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="max-w-[440px] w-full bg-white rounded-[24px] p-12 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        <div className="text-center mb-8">
          <Link href="/" className="text-[32px] font-black text-[#1A1A1A] mb-4 block no-underline">
            Bang<span className="text-[#FF6B00]">Parjo</span>
          </Link>
          <h1 className="text-[22px] font-black text-[#1A1A1A] mb-2">
            {mode === 'admin' ? 'Admin sign in' : (step === 'email' ? 'Sign in' : 'Check your email')}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {mode === 'admin' 
              ? 'Sign in with your admin credentials.'
              : (step === 'email' 
                ? 'Enter your email and we\'ll send you a login code.'
                : `We sent a code to ${email}`)}
          </p>
        </div>

        {mode === 'admin' ? (
          <form onSubmit={handleAdminLogin}>
            <div className="mb-5">
              <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Email Address</label>
              <input 
                type="email" 
                placeholder="admin@bangparjo.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-[12px] border border-gray-200 text-base outline-none focus:border-[#FF6B00]"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-[12px] border border-gray-200 text-base outline-none focus:border-[#FF6B00]"
              />
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-[10px] text-sm font-semibold">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="w-full px-6 py-4 rounded-md text-base font-black bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 disabled:opacity-50" disabled={loading || !email || !password}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Sign in'}
            </button>

            <div className="mt-5 text-center">
              <button type="button" onClick={switchMode} className="bg-none border-none cursor-pointer text-[#FF6B00] font-bold text-sm underline">
                Back to customer sign in
              </button>
            </div>
          </form>
        ) : step === 'email' ? (
          <form onSubmit={handleSendCode}>
            <div className="mb-5">
              <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-[12px] border border-gray-200 text-base outline-none focus:border-[#FF6B00]"
                autoFocus
              />
            </div>

            <div className="mb-5">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-[#1A1A1A]">
                <input 
                  type="checkbox" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-[18px] h-[18px] accent-[#FF6B00]"
                />
                Remember me
              </label>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-[10px] text-sm font-semibold">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="w-full px-6 py-4 rounded-md text-base font-black bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 disabled:opacity-50" disabled={loading || !email}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Continue'}
            </button>

            <div className="mt-5 text-center">
              <button type="button" onClick={switchMode} className="bg-none border-none cursor-pointer text-gray-500 font-semibold text-sm underline">
                Admin sign in
              </button>
            </div>
          </form>
        ) : (
          <div>
            <form onSubmit={handleVerifyCode}>
              <div className="flex gap-2 justify-center mb-6">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length > 1) return;
                      const newCode = [...code];
                      newCode[idx] = val;
                      setCode(newCode);
                      setError('');
                      if (val && idx < 5) {
                        inputRefs.current[idx + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !code[idx] && idx > 0) {
                        inputRefs.current[idx - 1]?.focus();
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className={`w-[48px] h-14 text-center text-2xl font-black rounded-[12px] border-2 outline-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'} caret-[#FF6B00]`}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-[10px] text-sm font-semibold">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="w-full px-6 py-4 rounded-md text-base font-black bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 disabled:opacity-50" disabled={loading || code.join('').length !== 6}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Sign in'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button 
                type="button" 
                onClick={handleResendCode}
                disabled={countdown > 0 || loading}
                className={`bg-none border-none cursor-pointer font-bold text-sm ${countdown > 0 ? 'text-gray-500 cursor-default' : 'text-[#FF6B00] underline'}`}
              >
                {countdown > 0 ? `Resend code in ${formatCountdown(countdown)}` : 'Resend code'}
              </button>
            </div>

            <div className="mt-3 text-center">
              <button 
                type="button" 
                onClick={handleChangeEmail}
                className="bg-none border-none cursor-pointer text-gray-500 font-semibold text-sm underline"
              >
                Use a different email
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>By continuing, you agree to our <Link href="/terms" className="text-[#FF6B00] font-bold no-underline">Terms of Service</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-circle-notch fa-spin fa-2x text-[#FF6B00]"></i>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
