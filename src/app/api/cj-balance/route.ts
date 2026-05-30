import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getBalance, payBalance, payBalanceV2 } from '@/lib/cj';

/**
 * GET /api/cj-balance
 * Returns the current CJ account balance.
 * Used by admin dashboard to show saldo CJ.
 */
export async function GET() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await getBalance();
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('[CJ Balance API] Error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cj-balance
 * Pay for CJ order(s) using balance.
 * Body: { orderNumber: string } or { orderNumbers: string[] }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderNumber, orderNumbers } = body;

    if (!orderNumber && (!orderNumbers || orderNumbers.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'orderNumber or orderNumbers is required' },
        { status: 400 }
      );
    }

    let res;
    if (orderNumbers && orderNumbers.length > 0) {
      // Bulk pay via V2 endpoint
      res = await payBalanceV2({ orderNumbers });
    } else {
      // Single order pay
      res = await payBalance({ orderNumber });
    }

    return NextResponse.json(res);
  } catch (error: any) {
    console.error('[CJ Balance Pay API] Error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
