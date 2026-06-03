'use server';

import { prisma } from '@/lib/db';
import { getProductDetails, cjFetch } from '@/lib/cj';
import { getAllCategories, getCategoryTree } from '@/lib/categories';
import type { CategoryNode } from '@/lib/categories';
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

    // Hapus varian sementara sebelum mengimpor yang asli
    await prisma.variant.deleteMany({
      where: {
        productId: product.id,
        OR: [
          { cjId: { startsWith: 'TEMP-VID-' } },
          { cjId: { endsWith: '-default' } },
        ]
      }
    });

    if (d.variants?.length) {
      for (const v of d.variants) {
        const baseCost = Number(v.variantSellPrice || 0);
        // sellingPrice = baseCost — margin diterapkan di frontend/checkout
        const sellingPrice = baseCost;
        
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
    for (const p of products) {
      const pid = p.id || p.pid;
      if (!pid) continue;

      const name = p.nameEn || p.productNameEn || p.productName;
      const image = p.bigImage || p.productImage;
      const baseCost = parseFloat(p.nowPrice || p.sellPrice || '0');
      // sellingPrice = baseCost — margin diterapkan di frontend/checkout
      const sellingPrice = baseCost;
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
      return { success: false, message: 'Product not found in database. Use dashboard to import first.' };
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

/**
 * Sync variants untuk semua produk yang cuma punya varian default/tempat
 * (varian dengan cjId berakhiran '-default' atau berawalan 'TEMP-VID-')
 *
 * Panggil dari dashboard atau API untuk mengisi varian asli dari CJ.
 */
export async function syncMissingVariantsAction() {
  try {
    // Cari produk yang cuma punya varian default/tempat
    const productsToSync = await prisma.product.findMany({
      where: {
        OR: [
          {
            // Produk dengan cuma 1 varian TEMP-VID
            variants: {
              some: { cjId: { startsWith: 'TEMP-VID-' } }
            }
          },
          {
            // Produk dengan cuma 1 varian -default
            variants: {
              some: { cjId: { endsWith: '-default' } }
            }
          }
        ]
      },
      select: { cjId: true, name: true, id: true }
    });

    if (productsToSync.length === 0) {
      return { success: true, synced: 0, skipped: 0, message: 'Semua produk sudah punya varian lengkap' };
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const p of productsToSync) {
      try {
        const result = await importProductVariantsAction(p.cjId);
        if (result.success) {
          synced++;
        } else {
          failed++;
          errors.push(`${p.name}: ${result.message}`);
        }
      } catch (err: any) {
        failed++;
        errors.push(`${p.name}: ${err.message}`);
      }
      
      // Rate limit protection — jangan spam CJ API
      await new Promise(r => setTimeout(r, 500));
    }

    return {
      success: true,
      synced,
      failed,
      total: productsToSync.length,
      errors: errors.slice(0, 10), // max 10 error samples
    };
  } catch (error: any) {
    return { success: false, error: error.message };
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
    // Ambil semua category IDs yang punya produk
    const catIdsWithProducts = new Set(
      (await prisma.category.findMany({
        where: { products: { some: {} } },
        select: { id: true },
      })).map(c => c.id)
    );

    const tree = await getCategoryTree();

    // Filter tree: hanya kategori yang punya produk (atau turunannya punya produk)
    function filterTree(nodes: CategoryNode[]): CategoryNode[] {
      return nodes.filter(node => {
        const filteredChildren = filterTree(node.children || []);
        const hasDirectProduct = catIdsWithProducts.has(node.id);
        const hasChildWithProduct = filteredChildren.length > 0;

        if (hasChildWithProduct) node.children = filteredChildren;
        return hasDirectProduct || hasChildWithProduct;
      });
    }

    const filteredTree = filterTree(tree);

    const menuData = filteredTree.map(l1 => ({
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

export async function getFullCategoryTreeAction() {
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
