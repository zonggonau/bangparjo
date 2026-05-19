import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notifyContactAdmin } from '@/lib/openclaw';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Save to database
    try {
      await (prisma as any).supportTicket.create({
        data: { name, email, subject, message }
      });
    } catch {
      await prisma.$executeRaw`
        INSERT INTO "SupportTicket" (id, name, email, subject, message, status, "createdAt", "updatedAt")
        VALUES (
          ${Math.random().toString(36).substring(2)}, 
          ${name}, 
          ${email}, 
          ${subject}, 
          ${message}, 
          'OPEN', 
          NOW(), 
          NOW()
        )
      `;
    }

    // Kirim notifikasi WA ke admin
    notifyContactAdmin({ name, email, subject, message })
      .catch(err => console.warn('[OpenClaw] Notif contact gagal:', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Contact API Error]:', error);
    return NextResponse.json({ error: 'Gagal mengirim pesan' }, { status: 500 });
  }
}
