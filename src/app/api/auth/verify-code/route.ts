import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Email and 6-digit code are required.' },
        { status: 400 }
      );
    }

    // Find valid OTP for this email
    const token = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: code,
        expires: { gt: new Date() },
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new one.' },
        { status: 401 }
      );
    }

    // Consume the OTP (one-time use)
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });

    // Auto-create user if not exists (first login = register)
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: email.split('@')[0],
          email,
          role: 'USER',
        },
      });
    }

    // ── Issue a one-time OTP session token ─────────────────────────────────
    // This token is passed as "password" to signIn('credentials') client-side.
    // auth.ts validates it and consumes it, preventing replay attacks.
    const sessionToken = `otp_session:${crypto.randomBytes(32).toString('hex')}`;
    const sessionExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Remove any stale otp_session tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: `otp_session:${email}` },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: `otp_session:${email}`,
        token: sessionToken,
        expires: sessionExpires,
      },
    });

    // Return the session token to the client — it will use it once via signIn()
    return NextResponse.json({
      success: true,
      email,
      sessionToken,
    });
  } catch (error) {
    console.error('[VERIFY-CODE] Error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
