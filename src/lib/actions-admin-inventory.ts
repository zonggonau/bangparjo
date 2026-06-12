'use server';

import { prisma } from '@/lib/db';
import { cjFetch, getProductDetails, CJProductDetail, getInventoryByPid } from '@/lib/cj';
import { revalidateTag, revalidatePath } from 'next/cache';
import { slugify, parseProductName } from '@/lib/utils';
import { generateLandingPageContent } from '@/lib/ai-content';
import { invalidateAppCache } from '@/lib/cache';
import { auth } from '@/auth';
import { getDBStoreSettings, applyMarginToPrice } from '@/lib/pricing';
import { resolveCategoryId } from './actions-catalog';

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return session;
}

async function invalidateProductCaches(categoryName?: string) {
  try {
    // 1. Invalidate main home keys
    await Promise.all([
      invalidateAppCache('home:featured'),
      invalidateAppCache('home:bestsellers'),
      invalidateAppCache('home:beauty'),
      invalidateAppCache('home:fashion'),
      invalidateAppCache('home:electronics'),
      invalidateAppCache('home:toys'),
      invalidateAppCache('home:homeliving'),
      invalidateAppCache('home:categories')
    ]);

    // 2. Invalidate category hybrid cache if name is known
    // Since we don't know the exact slug or params (sort, min, max, etc.) 
    // and Redis 'keys' command is expensive, we focus on the most common entries 
    // or let the 10-year cache be a baseline. 
    // For more surgical invalidation, we would need to track all used cache keys.
    
    // Attempt to invalidate first page of the specific category
    // Note: This is an approximation.
    if (categoryName) {
      // We'd need to find the category ID to be precise
      const cat = await prisma.category.findFirst({ where: { name: categoryName } });
      if (cat) {
        // Invalidate common first page variants
        await invalidateAppCache(`cat_hybrid_products_${cat.id}_p1_sdefault_min0_max0_fs0_kw`);
      }
    }
    
    // 3. Next.js cache tags and full layout revalidation
    revalidateTag('home:featured', { expire: 0 });
    revalidateTag('home:bestsellers', { expire: 0 });
    
    // Force frontend to refresh completely on next request
    revalidatePath('/', 'layout');
  } catch (err) {
    console.warn('[Cache Invalidation] Failed:', err);
  }
}

export async function updateAdminInventoryAction(data: { variantId?: string; sellingPrice?: number; id?: string; isHero?: boolean }) {
  try {
    await checkAdmin();
    if (data.variantId && data.sellingPrice !== undefined) {
      await prisma.variant.update({
        where: { id: data.variantId },
        data: { sellingPrice: data.sellingPrice },
      });
      return { success: true };
    }
    if (data.id && data.isHero !== undefined) {
      const p = await prisma.product.update({
        where: { id: data.id },
        data: { isHero: data.isHero },
      });
      
      // Force cache invalidation immediately to update Hero section
      await invalidateProductCaches();
      
      return { success: true, product: p };
    }
    return { success: false, error: 'Invalid payload' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncAdminInventoryAction(cjId: string) {
  try {
    await checkAdmin();
    const res = await cjFetch<CJProductDetail>(`/v1/product/query?pid=${cjId}`, { method: 'GET' });
    if (!res.result) return { success: false, error: 'Product not found in CJ' };

    const cjProduct = res.data;
    const variants = cjProduct.variants || [];

    // Fetch warehouse stock from getInventoryByPid
    const stockRes = await getInventoryByPid(cjId);
    const variantStockMap = new Map<string, number>();
    if (stockRes.success && stockRes.data && Array.isArray(stockRes.data.variantInventories)) {
      for (const vi of stockRes.data.variantInventories) {
        if (!vi.vid) continue;
        let total = 0;
        if (Array.isArray(vi.inventory)) {
          total = vi.inventory.reduce((acc: number, inv: any) => acc + (Number(inv.totalInventory || inv.totalInventoryNum || 0) || 0), 0);
        }
        variantStockMap.set(vi.vid, total);
      }
    }

    const updatedVariants = [];
    for (const v of variants) {
      if (!v.vid) continue;
      
      let variantStock = 0;
      if (variantStockMap.has(v.vid)) {
        variantStock = variantStockMap.get(v.vid)!;
      } else {
        // Fallback to variant metadata properties
        const vAny = v as any;
        if (Array.isArray(vAny.inventories) && vAny.inventories.length > 0) {
          variantStock = vAny.inventories.reduce((acc: number, inv: any) => acc + (Number(inv.totalInventory || inv.totalInventoryNum || 0) || 0), 0);
        } else if (vAny.variantNum !== undefined) {
          variantStock = Number(vAny.variantNum);
        } else if (vAny.inventory !== undefined) {
          variantStock = Number(vAny.inventory);
        }
      }

      const baseCost = Number(v.variantSellPrice || 0);
      // Hitung margin saat sync admin agar sellingPrice di DB tetap up-to-date
      const settings = await getDBStoreSettings();
      const sellingPrice = applyMarginToPrice(baseCost, settings);

      const updated = await prisma.variant.updateMany({
        where: { cjId: v.vid },
        data: {
          inventory: variantStock,
          baseCost: baseCost,
          sellingPrice: sellingPrice,
        },
      });
      if (updated.count > 0) {
        const variantDoc = await prisma.variant.findFirst({ where: { cjId: v.vid } });
        updatedVariants.push(variantDoc);
      }
    }

    // Also update parent product totalStock
    const product = await prisma.product.findUnique({
      where: { cjId },
      include: { variants: true }
    });
    if (product) {
      const totalStock = product.variants.reduce((acc, v) => acc + v.inventory, 0);
      await prisma.product.update({
        where: { id: product.id },
        data: { totalStock }
      });
    }

    return { success: true, data: { variants: updatedVariants } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminProductAction(productId?: string, variantId?: string) {
  try {
    await checkAdmin();
    if (productId) {
      await prisma.product.delete({ where: { id: productId } });
      return { success: true };
    }
    if (variantId) {
      const v = await prisma.variant.findUnique({ where: { id: variantId } });
      if (!v) return { success: false, error: 'Not found' };
      const product = await prisma.product.findUnique({
        where: { id: v.productId },
        include: { variants: true }
      });
      if (product?.variants.length === 1) {
        await prisma.product.delete({ where: { id: v.productId } });
      } else {
        await prisma.variant.delete({ where: { id: variantId } });
      }
      return { success: true };
    }
    return { success: false, error: 'Missing ID' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function fetchCjShippingMethods(variantCjId: string, quantity: number = 1, countryCode: string = 'US') {
  try {
    const CJ_API_KEY = process.env.CJ_ACCESS_TOKEN || process.env.CJ_API_KEY || '';
    const CJ_API_URL = process.env.CJ_API_URL || 'https://developers.cjdropshipping.com/api2.0/v1';
    if (!CJ_API_KEY) return [];

    const response = await fetch(`${CJ_API_URL}/shipping/freightCalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': CJ_API_KEY,
      },
      body: JSON.stringify({
        productVariants: [{ vid: variantCjId, quantity }],
        countryCode,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (data.success && data.data) {
      return data.data.map((m: Record<string, any>) => ({
        shippingName: m.shippingName || m.name || 'Standard Shipping',
        shippingCost: parseFloat(String(m.shippingCost || m.cost || 0)),
        estimatedDays: m.estimatedDays || m.deliveryTime || '7-21 days',
        shippingType: m.shippingType || 'standard',
      }));
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function exportToBlogAction(productId: string, lang: string = 'en') {
  try {
    await checkAdmin();
    if (!productId) return { success: false, error: 'productId is required' };

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!product) return { success: false, error: 'Product not found' };

    const displayName = parseProductName(product.name);
    const langSuffix = lang === 'id' ? '-id' : '';
    const slug = slugify(displayName) + '-' + product.cjId.toLowerCase() + langSuffix;

    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) return { success: false, error: 'Blog post already exists for this product', status: 409 };

    const productData: Record<string, any> = {
      type: 'product',
      productId: product.id,
      cjId: product.cjId,
      slug,
      name: displayName,
      description: product.description || '',
      images: product.images,
      variants: product.variants.map(v => ({
        id: v.id,
        cjId: v.cjId,
        sku: v.sku,
        color: v.color,
        size: v.size,
        weight: v.weight,
        baseCost: v.baseCost,
        sellingPrice: v.sellingPrice,
        inventory: v.inventory,
        image: v.image,
      })),
      createdAt: new Date().toISOString(),
    };

    try {
      const aiContent = await generateLandingPageContent(
        {
          name: displayName,
          description: product.description || '',
          images: product.images,
          variants: product.variants.map(v => ({
            color: v.color,
            size: v.size,
            sellingPrice: v.sellingPrice,
            inventory: v.inventory,
          })),
        },
        lang
      );
      productData.ai = aiContent;
    } catch (err) {}

    const firstVariant = product.variants[0];
    if (firstVariant) {
      const shippingMethods = await fetchCjShippingMethods(firstVariant.cjId, 1, 'US');
      if (shippingMethods.length > 0) {
        productData.shippingMethods = shippingMethods;
      }
    }

    const content = JSON.stringify(productData, null, 2);

    const post = await prisma.blogPost.create({
      data: {
        title: displayName + (lang === 'id' ? ' (ID)' : ' (EN)'),
        slug,
        excerpt: lang === 'id'
          ? `Ulasan produk dan detail untuk ${displayName}. Periksa harga, varian, dan spesifikasi.`
          : `Product review and details for ${displayName}. Check pricing, variants, and specifications.`,
        content,
        image: product.images[0] || null,
        author: 'Admin',
        published: true,
        language: lang,
      },
    });

    try {
        revalidateTag('blog:list', { expire: 0 });
    } catch (e) {}

    return {
      success: true,
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        aiGenerated: !!productData.ai,
        hasShipping: !!(productData.shippingMethods?.length > 0),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function importProductAction(
  productData: { pid: string; name: string; image: string; sellPrice: number | string; categoryName?: string } | string,
  isHero: boolean = false
) {
  try {
    await checkAdmin();
    let pid = '';
    let name = '';
    let image = '';
    let rawSellPrice: number | string = 0;
    let categoryName = '';

    if (typeof productData === 'string') {
      pid = productData;
    } else {
      pid = productData.pid;
      name = productData.name;
      image = productData.image;
      rawSellPrice = productData.sellPrice;
      categoryName = productData.categoryName || 'Imported';
    }

    if (!pid) return { success: false, error: 'Product ID (pid) is required' };

    // Fetch full details and variants from CJ directly
    const res = await getProductDetails(pid);
    if (!res.success || !res.data) {
      return { success: false, error: `Failed to fetch product details from CJ: ${res.message || 'Product not found'}` };
    }

    const cjProduct = res.data;
    name = cjProduct.productNameEn || cjProduct.productName || name || 'Imported Product';
    image = cjProduct.productImage || cjProduct.bigImage || image || '';
    rawSellPrice = cjProduct.sellPrice || rawSellPrice || 0;
    categoryName = cjProduct.categoryName || categoryName || 'Imported';
    
    // Fix: Resolve correct category links
    const cjCatId = cjProduct.categoryId || null;
    const resolvedCategoryId = await resolveCategoryId(cjCatId);

    // Fetch margin settings once
    const settings = await getDBStoreSettings();

    const existing = await prisma.product.findUnique({
      where: { cjId: pid },
      include: { variants: true }
    });

    // Determine variant data
    const variantCount = cjProduct.variants?.length || 0;
    const variantsData = [];

    if (variantCount > 0) {
      for (const v of cjProduct.variants) {
        const vCost = Number(v.variantSellPrice) || 0;
        variantsData.push({
          cjId: v.vid,
          sku: v.variantSku,
          color: v.variantKey || v.variantNameEn || v.variantName || 'Default',
          size: '',
          weight: v.variantWeight || 0,
          baseCost: vCost,
          sellingPrice: applyMarginToPrice(vCost, settings),
          inventory: 100, // Default inventory
          image: v.variantImage || cjProduct.productImage || image
        });
      }
    } else {
      let parsedPrice = 0;
      if (typeof rawSellPrice === 'number') parsedPrice = rawSellPrice;
      else if (rawSellPrice) parsedPrice = parseFloat(String(rawSellPrice)) || 0;
      if (isNaN(parsedPrice) || parsedPrice <= 0) parsedPrice = 0;

      variantsData.push({
        cjId: `${pid}-default`,
        sku: `${pid}-default`,
        color: 'Default',
        size: '',
        weight: 0,
        baseCost: parsedPrice,
        sellingPrice: applyMarginToPrice(parsedPrice, settings),
        inventory: 100,
        image: image
      });
    }

    if (existing) {
      // If product exists, update it with full details and variants
      await prisma.product.update({
        where: { id: existing.id },
        data: { 
          isHero: !!isHero,
          description: cjProduct.description || existing.description,
          images: cjProduct.productImageSet && cjProduct.productImageSet.length > 0 
                  ? cjProduct.productImageSet 
                  : (existing.images.length > 0 ? existing.images : [image]),
          status: 'ACTIVE',
          variantCount: variantsData.length,
          totalStock: variantsData.length * 100,
          cjCategoryId: cjCatId,
          categoryId: resolvedCategoryId,
        }
      });
      
      // Delete old variants and create new ones
      await prisma.variant.deleteMany({ where: { productId: existing.id } });
      await prisma.variant.createMany({
        data: variantsData.map(v => ({ ...v, productId: existing.id }))
      });
      
      await invalidateProductCaches(categoryName);
      return { success: true, message: 'Product already exists. Synced variants directly.', product: { ...existing, isHero: !!isHero } };
    }

    // Create new product with all variants
    const product = await prisma.product.create({
      data: {
        cjId: pid,
        name: name,
        description: cjProduct.description || '',
        images: cjProduct.productImageSet && cjProduct.productImageSet.length > 0 
                ? cjProduct.productImageSet 
                : [image],
        cjCategoryId: cjCatId,
        categoryId: resolvedCategoryId,
        variantCount: variantsData.length,
        totalStock: variantsData.length * 100,
        isHero: !!isHero,
        status: 'ACTIVE',
        variants: {
          create: variantsData
        }
      },
      include: {
        variants: true
      }
    });

    // Invalidate caches to show the new product
    await invalidateProductCaches(categoryName);

    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Maintenance: Fix all products that are missing categoryId relations.
 * This version syncs strictly using data already in the DB, avoiding CJ API calls.
 */
export async function fixAllProductCategoriesAction() {
  try {
    await checkAdmin();

    // Find products with missing link
    const products = await prisma.product.findMany({
      where: { categoryId: null },
      select: { id: true, cjId: true, name: true, cjCategoryId: true }
    });

    if (products.length === 0) {
      return { success: true, fixed: 0, message: 'All products are already linked to categories.' };
    }

    let fixed = 0;
    for (const p of products) {
      let cjCatId = p.cjCategoryId;

      // If cjCategoryId is empty, we can't fix it without API (so skip as requested "bukan dengan api")
      if (!cjCatId) continue;

      // If cjCategoryId looks like a name (no hyphen/UUID format), try to find by name in DB
      if (!cjCatId.includes('-')) {
        const catByName = await prisma.category.findFirst({
          where: { name: cjCatId },
          select: { cjId: true }
        });
        if (catByName && catByName.cjId) {
          cjCatId = catByName.cjId; // Update local variable to the actual UUID
        }
      }

      // Try to resolve the local Category UUID from the CJ Category UUID
      const resolvedId = await resolveCategoryId(cjCatId);
      if (resolvedId) {
        await prisma.product.update({
          where: { id: p.id },
          data: { 
            categoryId: resolvedId,
            // Only update cjCategoryId if we found a better one (UUID)
            ...(cjCatId.includes('-') ? { cjCategoryId: cjCatId } : {})
          }
        });
        fixed++;
      }
    }

    return { success: true, fixed, message: `Successfully fixed category links for ${fixed} products using local DB lookup.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Maintenance: Recalculate sellingPrice for ALL variants in the database
 * based on current margin tiers and store settings.
 * Optimized with batching to avoid server action timeouts.
 */
export async function recalculateAllPricesAction() {
  try {
    await checkAdmin();

    const settings = await getDBStoreSettings();
    const variants = await prisma.variant.findMany({
      select: { id: true, baseCost: true }
    });

    if (variants.length === 0) {
      return { success: true, updated: 0, message: 'No variants found to recalculate.' };
    }

    let updatedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < variants.length; i += batchSize) {
      const batch = variants.slice(i, i + batchSize);
      await Promise.all(batch.map(v => {
        const newSellingPrice = applyMarginToPrice(Number(v.baseCost), settings);
        return prisma.variant.update({
          where: { id: v.id },
          data: { sellingPrice: newSellingPrice }
        });
      }));
      updatedCount += batch.length;
    }

    // Invalidate caches since prices changed
    await invalidateProductCaches();

    return { 
      success: true, 
      updated: updatedCount, 
      message: `Successfully recalculated sellingPrice for ${updatedCount} variants.` 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

