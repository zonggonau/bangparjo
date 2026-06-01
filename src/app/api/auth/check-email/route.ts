import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true },
    });

    return NextResponse.json({
      exists: !!user,
      isAdmin: !!(user?.password), // Admin = user yang punya password
    });
  } catch (error) {
    console.error('[CHECK-EMAIL] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
