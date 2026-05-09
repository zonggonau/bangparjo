import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductDetails } from '@/lib/cj-api';
import { calculateFinalPrice, getDBStoreSettings } from '@/lib/pricing';

/**
 * Import a product from CJ to our local database
 * POST /api/admin/import-product
 */
export async function POST(req: Request) {
  try {
    const { pid, isHero } = await req.json();

    if (!pid) {
      return NextResponse.json({ error: 'Product ID (pid) is required' }, { status: 400 });
    }

    // 1. Fetch full details from CJ
    const res = await getProductDetails(pid);
    if (!res.success || !res.data) {
      return NextResponse.json({ error: res.message || 'Failed to fetch product from CJ' }, { status: 500 });
    }

    const cjProduct = res.data;

    // 2. Map to our Prisma schema
    const settings = await getDBStoreSettings();

    // Handle Category
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

    // Check if exists
    const existing = await prisma.product.findUnique({
      where: { cjId: pid },
      include: { variants: true }
    });

    if (existing) {
      // Update isHero flag using Raw Query to bypass locked client validation
      await prisma.$executeRaw`
        UPDATE "Product" SET "isHero" = ${!!isHero} WHERE id = ${existing.id}
      `;
      
      return NextResponse.json({ 
        success: true, 
        message: 'Product already exists. Updated isHero flag.', 
        product: { ...existing, isHero: !!isHero } 
      });
    }

    // Calculate summaries
    const variantCount = cjProduct.variants.length;
    const totalStock = 2000; // Default placeholder

    // Create product (Tanpa field isHero untuk menghindari error validasi client)
    const product = await prisma.product.create({
      data: {
        cjId: pid,
        name: cjProduct.productNameEn || cjProduct.productName,
        description: cjProduct.description,
        images: cjProduct.productImageSet || [cjProduct.productImage],
        categoryId: categoryId,
        variantCount,
        totalStock,
        // isHero: !!isHero, // Dihapus dari sini
        variants: {
          create: cjProduct.variants.map((v: any) => ({
            cjId: v.vid,
            sku: v.variantSku,
            color: v.variantNameEn || v.variantName || 'Default',
            size: '', 
            weight: v.variantWeight || 0,
            baseCost: v.variantSellPrice,
            sellingPrice: calculateFinalPrice(v.variantSellPrice, settings),
            inventory: 100, 
            image: v.variantImage || cjProduct.productImage
          }))
        }
      },
      include: {
        variants: true
      }
    });

    // Update isHero setelah create menggunakan raw query
    await prisma.$executeRaw`
      UPDATE "Product" SET "isHero" = ${!!isHero} WHERE id = ${product.id}
    `;

    return NextResponse.json({ success: true, product });

  } catch (error: any) {
    console.error('[Import Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
