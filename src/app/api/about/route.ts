/**
 * Public About API
 *
 * GET /api/about → Get published about page
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const about = await prisma.aboutPage.findFirst({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!about) {
      return NextResponse.json({ success: false, error: 'About page not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: about });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
