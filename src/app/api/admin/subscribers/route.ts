import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    await prisma.subscriber.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Delete Subscriber Error]:', error);
    return NextResponse.json({ error: 'Gagal menghapus subscriber' }, { status: 500 });
  }
}
