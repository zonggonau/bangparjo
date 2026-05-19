import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const userCount = await prisma.user.count();

    return NextResponse.json({ 
      isSetup: userCount > 0 
    });
  } catch (error) {
    return NextResponse.json({ isSetup: true }); // Safety fallback
  }
}
