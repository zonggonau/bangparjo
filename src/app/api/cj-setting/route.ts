import { NextResponse } from 'next/server';
import { cjFetch } from '@/lib/cj-api';
import { auth } from '@/auth';

export async function GET() {
  try {
    // Hanya user login yang boleh lihat CJ settings
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settingsData = await cjFetch('/v1/setting/get');
    return NextResponse.json(settingsData);
  } catch (error) {
    console.error('CJ Settings API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
