import { NextResponse } from 'next/server';
import { getSyncStatus } from '@/lib/cj-api';
import { auth } from '@/auth';

export async function GET() {
  // 1. Proteksi Admin
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const status = getSyncStatus();
  return NextResponse.json({ success: true, data: status });
}
