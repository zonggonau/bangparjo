import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { isEmailAuthorized } from '@/lib/auth-gate';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    // Periksa otorisasi email (apakah admin, active subscriber, atau buyer)
    const check = await isEmailAuthorized(email);
    if (!check.authorized) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    // Admin harus menggunakan login password, bukan OTP
    if (check.isAdmin) {
      return NextResponse.json(
        { error: 'Admin must use password login.' },
        { status: 403 }
      );
    }

    // ── Rate limit: max 3 OTP requests per email per 5 minutes ───────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || '127.0.0.1';
    const rateCheck = checkRateLimit(`otp:${email}:${ip}`, { interval: 300, maxRequests: 3 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many attempts. Please try again later.` },
        { status: 429 }
      );
    }

    // Generate OTP 6 digit
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hapus OTP lama untuk email ini
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });

    // Simpan OTP baru
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires,
      }
    });

    // Kirim email
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transport.sendMail({
      to: email,
      from: `"BangParjo Shop" <${process.env.SMTP_USER}>`,
      subject: `Your BangParjo login code is ${otp}`,
      text: `Your BangParjo login code: ${otp}\n\nThis code expires in 10 minutes.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
          <h2 style="color: #FF6B00; text-align: center; font-size: 28px; font-weight: 900; margin-bottom: 30px;">BangParjo</h2>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">Enter this code to sign in to your BangParjo account.</p>
          
          <div style="background: #F8FAFC; padding: 32px; border-radius: 16px; text-align: center; margin: 30px 0;">
            <p style="font-size: 13px; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; margin-bottom: 12px;">Verification Code</p>
            <h1 style="font-size: 48px; font-weight: 900; color: #0F172A; margin: 0; letter-spacing: 0.3em;">${otp}</h1>
          </div>

          <p style="font-size: 14px; color: #94A3B8; line-height: 1.6;">This code expires in <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="font-size: 12px; color: #CBD5E1;">&copy; 2024 BangParjo Marketplace. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SEND-OTP] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send code. Please try again.' },
      { status: 500 }
    );
  }
}
