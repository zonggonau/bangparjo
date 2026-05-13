import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductDetails } from '@/lib/cj-api';

/**
 * Endpoint for OpenClaw AI to import a product from CJ Dropshipping
 * POST /api/admin/openclaw-import
 * 
 * Body:
 * {
 *   "pid": "1234567890", // CJ Product ID
 *   "apiKey": "your-secret-key" // Simple protection
 * }
 */
export async function POST(req: Request) {
  try {
    const { pid, apiKey } = await req.json();

    // 1. Basic Auth check
    const secret = process.env.OPENCLAW_API_KEY || 'openclaw_secret_2026';
    if (apiKey !== secret) {
      return NextResponse.json({ error: 'Unauthorized. Invalid API Key.' }, { status: 401 });
    }

    if (!pid) {
      return NextResponse.json({ error: 'Product ID (pid) is required' }, { status: 400 });
    }

    // 2. Fetch full details from CJ Dropshipping API
    const res = await getProductDetails(pid);
    if (!res.success || !res.data) {
      return NextResponse.json({ error: res.message || 'Failed to fetch product from CJ Dropshipping' }, { status: 500 });
    }

    const cjProduct = res.data;

    // 3. Handle Category (Optional, since we only sell via direct link, but good for local DB)
    let categoryId = null;
    if (cjProduct.categoryId) {
      const cat = await prisma.category.upsert({
        where: { cjId: cjProduct.categoryId },
        update: { name: cjProduct.categoryName || 'Unknown Category' },
        create: {
          cjId: cjProduct.categoryId,
          name: cjProduct.categoryName || 'Unknown Category',
          slug: (cjProduct.categoryName || 'cat').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + cjProduct.categoryId
        }
      });
      categoryId = cat.id;
    }

    // 4. Check if product already exists in local DB
    const existing = await prisma.product.findUnique({
      where: { cjId: pid },
      include: { variants: true }
    });

    const checkoutLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://bangparjo.shop'}/buy/${pid}--${(cjProduct.productNameEn || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Product already exists in local database.', 
        checkoutUrl: checkoutLink,
        product: existing
      });
    }

    // 5. Create new product in local DB
    const variantCount = cjProduct.variants?.length || 0;
    const totalStock = cjProduct.variants?.reduce((acc: number, v: any) => acc + (v.variantInventory || 100), 0) || 1000;

    const product = await prisma.product.create({
      data: {
        cjId: pid,
        name: cjProduct.productNameEn || cjProduct.productName,
        description: cjProduct.description,
        images: cjProduct.productImageSet || [cjProduct.productImage],
        categoryId: categoryId,
        variantCount,
        totalStock,
        variants: {
          create: (cjProduct.variants || []).map((v: any) => ({
            cjId: v.vid,
            sku: v.variantSku,
            color: v.variantNameEn || v.variantName || 'Default',
            size: '', 
            weight: v.variantWeight || 0,
            baseCost: v.variantSellPrice || 0,
            sellingPrice: v.variantSellPrice || 0, // Frontend buy page handles markup
            inventory: v.variantInventory || 100, 
            image: v.variantImage || cjProduct.productImage
          }))
        }
      },
      include: {
        variants: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Product imported successfully.',
      checkoutUrl: checkoutLink,
      product 
    });

  } catch (error: any) {
    console.error('[OpenClaw Import Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
