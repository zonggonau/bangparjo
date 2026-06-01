import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    return NextResponse.json({ isSetup: adminCount > 0 });
  } catch (error: any) {
    console.error('Setup check error:', error);
    return NextResponse.json({ isSetup: true, error: 'Failed to check setup' }, { status: 500 });
  }
}
