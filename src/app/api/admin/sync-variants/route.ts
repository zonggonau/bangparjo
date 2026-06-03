import { NextResponse } from 'next/server';
import { syncMissingVariantsAction } from '@/lib/actions-catalog';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const apiKey = req.headers.get('x-scripts-api-key');
    const validApiKey = process.env.SCRIPTS_API_KEY && apiKey === process.env.SCRIPTS_API_KEY;

    if (session?.user?.role !== 'ADMIN' && !validApiKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncMissingVariantsAction();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
