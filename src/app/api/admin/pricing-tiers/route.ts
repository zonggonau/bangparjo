import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const tiers = await prisma.pricingTier.findMany({
    orderBy: { minPrice: 'asc' },
  });
  return NextResponse.json(tiers);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tier = await prisma.pricingTier.create({
      data: {
        minPrice: parseFloat(body.minPrice),
        maxPrice: body.maxPrice ? parseFloat(body.maxPrice) : null,
        marginPercent: parseFloat(body.marginPercent),
      },
    });
    return NextResponse.json(tier);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await prisma.pricingTier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
