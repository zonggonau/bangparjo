'use server';

import { prisma } from '@/lib/db';
import { cjFetch, getProductDetails, CJProductDetail, getInventoryByPid } from '@/lib/cj';
import { revalidateTag } from 'next/cache';
import { slugify, parseProductName } from '@/lib/utils';
import { generateLandingPageContent } from '@/lib/ai-content';
import { invalidateAppCache } from '@/lib/cache';

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
    
    // 3. Next.js cache tags
    revalidateTag('home:featured');
    revalidateTag('home:bestsellers');
  } catch (err) {
    console.warn('[Cache Invalidation] Failed:', err);
  }
}

export async function updateAdminInventoryAction(data: { variantId?: string; sellingPrice?: number; id?: string; isHero?: boolean }) {
  try {
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
      return { success: true, product: p };
    }
    return { success: false, error: 'Invalid payload' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncAdminInventoryAction(cjId: string) {
  try {
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

      const updated = await prisma.variant.updateMany({
        where: { cjId: v.vid },
        data: {
          inventory: variantStock,
          baseCost: baseCost,
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
    let pid = '';
    let name = '';
    let image = '';
    let rawSellPrice: number | string = 0;
    let categoryName = '';

    if (typeof productData === 'string') {
      pid = productData;
      const res = await cjFetch<any>(`/v1/product/query?pid=${pid}`, { method: 'GET' });
      if (!res.result || !res.data) {
        return { success: false, error: `Failed to fetch product details from CJ: ${res.message || 'Product not found'}` };
      }
      const cjProduct = res.data;
      name = cjProduct.productNameEn || cjProduct.productName || 'Imported Product';
      image = cjProduct.productImage || cjProduct.bigImage || '';
      rawSellPrice = cjProduct.sellPrice || 0;
      categoryName = cjProduct.categoryName || 'Imported';
    } else {
      pid = productData.pid;
      name = productData.name;
      image = productData.image;
      rawSellPrice = productData.sellPrice;
      categoryName = productData.categoryName || 'Imported';
    }

    if (!pid) return { success: false, error: 'Product ID (pid) is required' };

    // Robust parsing for sellPrice to prevent NaN prisma error
    let parsedPrice = 0;
    if (typeof rawSellPrice === 'number') {
      parsedPrice = rawSellPrice;
    } else if (rawSellPrice) {
      parsedPrice = parseFloat(String(rawSellPrice)) || 0;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      parsedPrice = 0;
    }

    const existing = await prisma.product.findUnique({
      where: { cjId: pid },
      include: { variants: true }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { 
          isHero: !!isHero,
          status: 'SYNCING_VARIANTS'
        }
      });
      
      // Trigger background sync
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sync-product-variants?pid=${pid}`).catch(() => {});
      
      return { success: true, message: 'Product already exists. Triggered variant sync.', product: { ...existing, isHero: !!isHero } };
    }

    const product = await prisma.product.create({
      data: {
        cjId: pid,
        name: name,
        description: 'Product details are being synced in the background...',
        images: [image],
        cjCategoryId: categoryName || null,
        variantCount: 1, // Placeholder
        totalStock: 0,
        isHero: !!isHero,
        status: 'SYNCING_VARIANTS',
        variants: {
          create: [{
            cjId: `${pid}-default`,
            sku: `${pid}-default`,
            color: 'Default',
            size: '', 
            weight: 0,
            baseCost: parsedPrice,
            sellingPrice: parsedPrice, 
            inventory: 0, 
            image: image
          }]
        }
      },
      include: {
        variants: true
      }
    });

    // Trigger background sync asynchronously (fire and forget)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sync-product-variants?pid=${pid}`).catch(() => {});

    // Invalidate caches to show the new product
    await invalidateProductCaches(categoryName);

    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



