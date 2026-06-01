import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    if (adminCount > 0) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error: any) {
    console.error('Setup register error:', error);
    return NextResponse.json({ error: 'Failed to register admin' }, { status: 500 });
  }
}
