import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { trackInfo, getTrackInfo } from '@/lib/cj-api';

/**
 * GET /api/cj-warehouse/track?trackingNumber=CJ123456789CN
 * Returns tracking information from CJ for a given tracking number.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const trackingNumber = searchParams.get('trackingNumber');

  if (!trackingNumber) {
    return NextResponse.json(
      { success: false, message: 'trackingNumber is required' },
      { status: 400 }
    );
  }

  try {
    // Use the newer trackInfo endpoint first, fallback to deprecated getTrackInfo
    let res = await trackInfo(trackingNumber);
    if (!res.success) {
      res = await getTrackInfo(trackingNumber);
    }
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('[CJ Track API] Error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
