import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    // 1. Cek apakah sudah ada admin
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    if (adminCount > 0) {
      return NextResponse.json({ error: 'Setup sudah selesai. Silakan login.' }, { status: 400 });
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Buat Super Admin pertama
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({ success: true, message: 'Super Admin berhasil dibuat' });
  } catch (error: any) {
    console.error('[Setup Register Error]:', error);
    return NextResponse.json({ error: 'Gagal membuat admin' }, { status: 500 });
  }
}
