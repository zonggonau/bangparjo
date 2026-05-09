import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    return NextResponse.json({ 
      isSetup: adminCount > 0 
    });
  } catch (error) {
    return NextResponse.json({ isSetup: true }); // Safety fallback
  }
}
