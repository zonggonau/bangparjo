'use server';

import { prisma } from '@/lib/db';
import { getProductDetails, cjFetch } from '@/lib/cj';
import { getAllCategories, getCategoryTree } from '@/lib/categories';
import { getDBStoreSettings, calculateFinalPrice } from './pricing';

/**
 * Helper: Resolve categoryId (UUID FK ke tabel Category lokal)
 * dari cjCategoryId (UUID dari CJ API).
 * Ini yang menyambungkan produk ke mega menu.
 */
async function resolveCategoryId(cjCategoryId: string | null | undefined): Promise<string | null> {
  if (!cjCategoryId) return null;
  try {
    const cat = await prisma.category.findFirst({
      where: { cjId: cjCategoryId },
      select: { id: true },
    });
    return cat?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Otomatis import produk dan varian ke DB lokal.
 * Digunakan saat user klik card produk.
 */
export async function importProductVariantsAction(cjId: string) {
  if (!cjId) return { success: false, message: 'Missing cjId' };
  
  try {
    const detail = await getProductDetails(cjId);
    if (!detail.success || !detail.data) {
      return { success: false, message: detail.message || 'Failed to fetch details from CJ' };
    }

    const d = detail.data;
    const settings = await getDBStoreSettings();

    // Resolve categoryId FK dari cjCategoryId — agar produk terhubung ke mega menu
    const resolvedCategoryId = await resolveCategoryId(d.categoryId);

    const product = await prisma.product.upsert({
      where: { cjId: d.pid },
      update: {
        name: d.productNameEn || d.productName,
        description: d.description || '',
        images: d.productImageSet && d.productImageSet.length > 0 ? d.productImageSet : [d.productImage],
        variantCount: d.variants?.length || 0,
        totalStock: d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0,
        cjCategoryId: d.categoryId || null,
        categoryId: resolvedCategoryId,   // ← Link ke tabel Category
        updatedAt: new Date()
      },
      create: {
        cjId: d.pid,
        name: d.productNameEn || d.productName,
        description: d.description || '',
        images: d.productImageSet && d.productImageSet.length > 0 ? d.productImageSet : [d.productImage],
        variantCount: d.variants?.length || 0,
        totalStock: d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0,
        cjCategoryId: d.categoryId || null,
        categoryId: resolvedCategoryId,   // ← Link ke tabel Category
        status: 'ACTIVE'
      }
    });

    // Hapus varian sementara jika ada sebelum mengimpor yang asli
    await prisma.variant.deleteMany({
      where: {
        productId: product.id,
        cjId: { startsWith: 'TEMP-VID-' }
      }
    });

    if (d.variants?.length) {
      for (const v of d.variants) {
        const baseCost = Number(v.variantSellPrice || 0);
        const sellingPrice = calculateFinalPrice(baseCost, settings);
        
        await prisma.variant.upsert({
          where: { cjId: v.vid },
          update: {
            sku: v.variantSku,
            color: v.variantKey || '',
            size: v.variantNameEn || '',
            weight: v.variantWeight || 0,
            baseCost: baseCost,
            sellingPrice: sellingPrice,
            inventory: v.inventory || 100,
            image: v.variantImage || d.productImage
          },
          create: {
            productId: product.id,
            cjId: v.vid,
            sku: v.variantSku,
            color: v.variantKey || '',
            size: v.variantNameEn || '',
            weight: v.variantWeight || 0,
            baseCost: baseCost,
            sellingPrice: sellingPrice,
            inventory: v.inventory || 100,
            image: v.variantImage || d.productImage
          }
        });
      }
    }

    return { success: true, message: 'Imported successfully' };
  } catch (error) {
    console.error('[Import Action] Error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Batch import produk dari list (misal: halaman kategori).
 * Mengimpor produk dengan 1 varian default agar cepat.
 *
 * @param products   - List produk dari CJ API V2
 * @param forceCategoryId - (opsional) ID kategori lokal (UUID) yang langsung dipakai.
 *                         Gunakan ini saat import dari halaman kategori tertentu,
 *                         supaya produk langsung terhubung ke kategori yang sedang di-browse.
 */
export async function importProductsBatchAction(products: any[], forceCategoryId?: string) {
  if (!products || products.length === 0) return { success: false };
  
  try {
    const settings = await getDBStoreSettings();
    
    for (const p of products) {
      const pid = p.id || p.pid;
      if (!pid) continue;

      const name = p.nameEn || p.productNameEn || p.productName;
      const image = p.bigImage || p.productImage;
      const baseCost = parseFloat(p.nowPrice || p.sellPrice || '0');
      const sellingPrice = calculateFinalPrice(baseCost, settings);
      const sku = p.sku || p.productSku || `SKU-${pid}`;
      const cjCatId = p.categoryId || null;

      // Resolve categoryId:
      //   1. Gunakan forceCategoryId jika ada (dari halaman kategori yang sedang di-browse)
      //   2. Fallback: lookup berdasarkan cjCategoryId dari data produk CJ API
      const resolvedCategoryId = forceCategoryId ?? await resolveCategoryId(cjCatId);
      
      // Upsert Product
      const product = await prisma.product.upsert({
        where: { cjId: pid },
        update: {
          name: name,
          images: { set: [image] },
          cjCategoryId: cjCatId,
          categoryId: resolvedCategoryId,   // ← Link ke tabel Category
          updatedAt: new Date()
        },
        create: {
          cjId: pid,
          name: name,
          description: '',
          images: [image],
          cjCategoryId: cjCatId,
          categoryId: resolvedCategoryId,   // ← Link ke tabel Category
          status: 'ACTIVE'
        }
      });

      // Cek apakah produk sudah punya varian asli
      const hasRealVariants = await prisma.variant.count({
        where: {
          productId: product.id,
          NOT: { cjId: { startsWith: 'TEMP-VID-' } }
        }
      });

      if (hasRealVariants === 0) {
        const tempVid = `TEMP-VID-${pid}`;
        await prisma.variant.upsert({
          where: { cjId: tempVid },
          update: {
            sku: sku,
            baseCost: baseCost,
            sellingPrice: sellingPrice,
            image: image,
            inventory: p.warehouseInventoryNum || 100
          },
          create: {
            productId: product.id,
            cjId: tempVid,
            sku: sku,
            color: 'Default',
            size: 'Standard',
            weight: 0,
            baseCost: baseCost,
            sellingPrice: sellingPrice,
            image: image,
            inventory: p.warehouseInventoryNum || 100
          }
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Batch Import Action] Error:', error);
    return { success: false };
  }
}

export async function getProductDetailsAction(cjId: string) {
  if (!cjId) return { success: false, message: 'Missing cjId' };
  
  try {
    const product = await prisma.product.findUnique({
      where: { cjId },
      include: { variants: true }
    });

    if (!product) {
      // Fallback to CJ API
      const cjRes = await getProductDetails(cjId);
      if (cjRes.success && cjRes.data) {
        const productData = cjRes.data as any;
        return {
          success: true,
          data: {
            pid: productData.pid,
            productName: productData.productNameEn || productData.productName,
            productNameEn: productData.productNameEn || productData.productName,
            productImage: productData.productImage || productData.bigImage || '',
            bigImage: productData.bigImage || productData.productImage || '',
            sellPrice: productData.sellPrice || 0,
            description: productData.description || '',
            variants: (productData.variants || []).map((v: any) => ({
              vid: v.vid,
              variantNameEn: v.variantNameEn || v.variantKey || 'Default',
              variantSellPrice: v.variantSellPrice,
              variantSku: v.variantSku,
              variantWeight: v.variantWeight,
              inventory: v.inventory,
              variantImage: v.variantImage || '',
              variantKey: v.variantKey || 'default',
            })),
          }
        };
      }
      return { success: false, message: 'Not found' };
    }
    
    return {
      success: true,
      data: {
        pid: product.cjId,
        productName: product.name,
        productNameEn: product.name,
        productImage: product.images?.[0] || '',
        bigImage: product.images?.[0] || '',
        sellPrice: product.variants?.[0]?.baseCost || 0,
        description: product.description || '',
        variants: product.variants.map((v: any) => ({
          vid: v.cjId,
          variantNameEn: [v.color, v.size].filter(Boolean).join(' / ') || 'Default',
          variantSellPrice: v.sellingPrice,
          variantSku: v.sku,
          variantWeight: v.weight,
          inventory: v.inventory,
          variantImage: v.image || '',
          variantKey: [v.color, v.size].filter(Boolean).join(' - ') || 'default',
        })),
      }
    };
  } catch (error: any) {
    console.error('[Product Action] Error:', error);
    return { success: false, message: error.message };
  }
}

export async function getAllCategoriesAction() {
  try {
    const allCats = await getAllCategories();
    return {
      success: true,
      data: allCats,
      total: allCats.length,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategoryMenuAction() {
  try {
    const tree = await getCategoryTree();
    const menuData = tree.map(l1 => ({
      id: l1.id,
      name: l1.name,
      slug: l1.slug,
      children: l1.children.map(l2 => ({
        id: l2.id,
        name: l2.name,
        slug: l2.slug,
        children: l2.children.map(l3 => ({
          id: l3.id,
          name: l3.name,
          slug: l3.slug,
        }))
      }))
    }));

    return { success: true, data: menuData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── CJ Proxy Server Action ──
// Safely exposes CJ fetch to client components.
export async function cjProxyAction(endpoint: string, options: any = {}) {
  try {
    const resData = await cjFetch(endpoint, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!resData.success && resData.message?.toLowerCase().includes('qps')) {
      return { success: false, result: false, message: resData.message, data: null, status: 429 };
    }

    return resData;
  } catch (error: any) {
    return { success: false, message: error.message, status: 500 };
  }
}
