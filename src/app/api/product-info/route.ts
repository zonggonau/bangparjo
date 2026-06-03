import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/product-info?pid=xxx
 * 
 * Digunakan oleh AI Agent untuk cek data produk dari database.
 * Returns: product info with variants, prices, stock
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pid = searchParams.get('pid');
  const keyword = searchParams.get('q');
  const orderNum = searchParams.get('order');

  try {
    // Cek order
    if (orderNum) {
      const order = await prisma.order.findUnique({
        where: { orderNum },
      });
      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' });
      }
      return NextResponse.json({
        success: true,
        data: {
          orderNum: order.orderNum,
          status: order.status,
          customerName: order.customerName,
          totalAmount: order.totalAmount,
          trackingNumber: order.trackingNumber,
          createdAt: order.createdAt,
        }
      });
    }

    // Cek produk by PID
    if (pid) {
      const product = await prisma.product.findUnique({
        where: { cjId: pid },
        include: {
          variants: true,
          category: true,
        }
      });

      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found in database' });
      }

      return NextResponse.json({
        success: true,
        data: {
          pid: product.cjId,
          name: product.name,
          description: product.description,
          images: product.images,
          category: product.category?.name || null,
          variants: product.variants.map(v => ({
            vid: v.cjId,
            sku: v.sku,
            color: v.color,
            size: v.size,
            weight: v.weight,
            baseCost: v.baseCost,
            retailPrice: v.sellingPrice || v.baseCost, // Gunakan sellingPrice dari DB
            inventory: v.inventory,
            image: v.image,
          })),
          variantCount: product.variantCount,
          minPrice: Math.min(...product.variants.map(v => v.baseCost)),
          maxPrice: Math.max(...product.variants.map(v => v.baseCost)),
          totalStock: product.variants.reduce((a, v) => a + v.inventory, 0),
        }
      });
    }

    // Search produk by keyword
    if (keyword) {
      const products = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          name: { contains: keyword, mode: 'insensitive' },
        },
        include: {
          variants: { take: 1 },
          category: true,
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: products.map(p => ({
          pid: p.cjId,
          name: p.name,
          image: p.images?.[0] || '',
          category: p.category?.name || null,
          price: p.variants?.[0]?.baseCost || 0,
          retailPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
          stock: p.variants?.[0]?.inventory || 0,
          variantCount: p.variantCount,
        })),
        total: products.length,
      });
    }

    return NextResponse.json({ success: false, error: 'Provide pid, q, or order parameter' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
