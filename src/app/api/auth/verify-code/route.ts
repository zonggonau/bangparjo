import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Email and 6-digit code are required.' },
        { status: 400 }
      );
    }

    // Cari OTP untuk email ini yang belum expired
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

    // Hapus OTP yang sudah digunakan
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });

    // Cari atau buat user (auto-register)
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: email.split('@')[0],
          email,
          role: 'USER',
        }
      });
    }

    // Kembalikan sukses — client-side akan handle login via signIn
    return NextResponse.json({
      success: true,
      email,
    });
  } catch (error) {
    console.error('[VERIFY-CODE] Error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
