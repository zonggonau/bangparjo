import { NextRequest, NextResponse } from 'next/server';
import { isEmailAuthorized } from '@/lib/auth-gate';

/**
 * GET /api/auth/check-email?email=xxx
 * Returns: { isAdmin: bool, exists: bool }
 * 
 * Digunakan login page untuk auto-detect:
 * - Jika isAdmin → tampilkan password field
 * - Jika !isAdmin → kirim OTP ke email
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Periksa otorisasi email (apakah admin, active subscriber, atau buyer)
    const check = await isEmailAuthorized(email);
    if (!check.authorized) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    return NextResponse.json({
      exists: check.userExists,
      isAdmin: check.isAdmin,
    });
  } catch (error) {
    console.error('[CHECK-EMAIL] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
