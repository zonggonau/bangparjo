import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductDetails } from '@/lib/cj-api';

/**
 * API untuk Otomasi Eksternal (OpenClaw, dsb)
 * POST /api/admin/auto-import
 * Body: { cjId: "string" }
 */
export async function POST(req: Request) {
  try {
    const { cjId } = await req.json();

    if (!cjId) {
      return NextResponse.json({ error: 'CJ Product ID diperlukan' }, { status: 400 });
    }

    console.log(`[Auto-Import] Memulai impor otomatis untuk CJ ID: ${cjId}`);

    // 1. Ambil detail produk dari API CJ
    const res = await getProductDetails(cjId);
    if (!res.success || !res.data) {
      return NextResponse.json({ error: 'Gagal mengambil data dari CJ' }, { status: 404 });
    }

    const p = res.data;

    // 2. Simpan ke database (Upsert)
    // Menggunakan raw SQL bypass untuk menghindari masalah locking di Windows
    await prisma.$executeRaw`
      INSERT INTO "Product" (id, "cjId", name, description, images, "variantCount", "totalStock", status, "createdAt", "updatedAt")
      VALUES (
        ${crypto.randomUUID()},
        ${p.pid},
        ${p.productNameEn},
        ${p.description || ''},
        ${p.productImage ? [p.productImage] : []},
        ${p.variants?.length || 0},
        ${p.variants?.reduce((acc: number, v: any) => acc + (v.inventory || 0), 0) || 0},
        'ACTIVE',
        NOW(),
        NOW()
      )
      ON CONFLICT ("cjId") DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        "variantCount" = EXCLUDED."variantCount",
        "totalStock" = EXCLUDED."totalStock",
        "updatedAt" = NOW()
    `;

    // 3. Simpan Varian (Hapus lama, masukkan baru untuk sinkronisasi stok)
    if (p.variants && p.variants.length > 0) {
      // Ambil ID produk yang baru saja dimasukkan/diupdate
      const product: any = await prisma.$queryRaw`SELECT id FROM "Product" WHERE "cjId" = ${p.pid} LIMIT 1`;
      const productId = product[0].id;

      await prisma.$executeRaw`DELETE FROM "Variant" WHERE "productId" = ${productId}`;

      for (const v of p.variants) {
        await prisma.$executeRaw`
          INSERT INTO "Variant" (id, "productId", "cjId", sku, color, size, weight, "baseCost", "sellingPrice", inventory, image)
          VALUES (
            ${crypto.randomUUID()},
            ${productId},
            ${v.vid},
            ${v.variantSku},
            ${v.variantKey || ''},
            ${v.variantNameEn || ''},
            ${v.variantWeight || 0},
            ${v.variantSellPrice || 0},
            ${(v.variantSellPrice || 0) * 1.3}, 
            ${v.inventory || 0},
            ${v.variantImage || p.productImage}
          )
        `;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Produk ${p.productNameEn} berhasil diimpor otomatis.` 
    });

  } catch (error: any) {
    console.error('[Auto-Import Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
