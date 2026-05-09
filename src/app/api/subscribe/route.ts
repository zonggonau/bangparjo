import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 });
    }

    // Upsert subscriber
    const sub = await prisma.subscriber.upsert({
      where: { email },
      update: { isActive: true },
      create: { email, isActive: true }
    });

    return NextResponse.json({ success: true, message: 'Berhasil berlangganan!' });
  } catch (error: any) {
    console.error('[Subscribe Error]:', error);
    return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 });
  }
}
