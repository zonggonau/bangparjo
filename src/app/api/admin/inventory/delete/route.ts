import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // Product ID
    const variantId = searchParams.get('variantId');

    if (!id && !variantId) {
      return NextResponse.json({ success: false, error: 'ID or VariantID is required' }, { status: 400 });
    }

    // --- CASE 1: DELETE SINGLE VARIANT ---
    if (variantId) {
      // Check if variant is in an order
      const usedInOrder = await prisma.orderItem.findFirst({
        where: { variantId }
      });

      if (usedInOrder) {
        return NextResponse.json({ success: false, error: 'Cannot delete variant because it is linked to orders.' }, { status: 400 });
      }

      await prisma.variant.delete({
        where: { id: variantId }
      });

      return NextResponse.json({ success: true, message: 'Variant deleted successfully' });
    }

    // --- CASE 2: DELETE FULL PRODUCT ---
    // Check if any variant of this product is in an order
    const usedInOrder = await prisma.orderItem.findFirst({
      where: {
        variant: { productId: id as string }
      }
    });

    if (usedInOrder) {
      return NextResponse.json({ 
        success: false,
        error: 'Cannot delete product because it is linked to existing orders.' 
      }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Step A: Delete all associated variants first
      await tx.variant.deleteMany({
        where: { productId: id as string }
      });

      // Step B: Delete the product
      await tx.product.delete({
        where: { id: id as string }
      });
    });

    return NextResponse.json({ success: true, message: 'Product and variants deleted successfully' });

  } catch (err: any) {
    console.error('[Inventory Delete Internal Error]:', err);
    return NextResponse.json({ 
      success: false,
      error: `Database error: ${err.message}` 
    }, { status: 500 });
  }
}
