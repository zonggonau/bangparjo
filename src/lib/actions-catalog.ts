'use server';

import { prisma } from '@/lib/db';
import { getProductDetails, cjFetch } from '@/lib/cj-api';
import { getAllCategories, getCategoryTree } from '@/lib/categories';

export async function getProductDetailsAction(cjId: string) {
  if (!cjId) return { success: false, message: 'Missing cjId' };
  
  try {
    let product: any = await prisma.product.findUnique({
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
