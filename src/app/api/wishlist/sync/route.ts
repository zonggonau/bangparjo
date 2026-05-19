import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Invalid items' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Replace all wishlist items for this user
    await prisma.wishlistItem.deleteMany({ where: { userId: user.id } });

    if (items.length > 0) {
      await prisma.wishlistItem.createMany({
        data: items.map((item: any) => ({
          userId: user.id,
          pid: item.pid,
          productName: item.productName || '',
          productNameEn: item.productNameEn || '',
          productImage: item.productImage || '',
          bigImage: item.bigImage || '',
          sellPrice: parseFloat(item.sellPrice) || 0,
          categoryName: item.categoryName || '',
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Wishlist sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wishlistItems: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user.wishlistItems });
  } catch (error: any) {
    console.error('Wishlist fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
