'use server';

import { prisma } from '@/lib/db';
import { cjFetch, getProductDetails } from '@/lib/cj-api';
import { revalidateTag } from 'next/cache';
import { slugify, parseProductName } from '@/lib/cj-utils';
import { generateLandingPageContent } from '@/lib/ai-content';

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
    const res = await cjFetch(`/v1/product/query?pid=${cjId}`, { method: 'GET' });
    if (!res.result) return { success: false, error: 'Product not found in CJ' };

    const cjProduct = res.data as any;
    const variants = cjProduct.variants || [];

    const updatedVariants = [];
    for (const v of variants) {
      if (!v.vid) continue;
      const updated = await prisma.variant.updateMany({
        where: { cjId: v.vid },
        data: {
          inventory: Number(v.variantNum || 0),
          baseCost: Number(v.variantPrice || 0),
        },
      });
      if (updated.count > 0) {
        const variantDoc = await prisma.variant.findFirst({ where: { cjId: v.vid } });
        updatedVariants.push(variantDoc);
      }
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
      return data.data.map((m: any) => ({
        shippingName: m.shippingName || m.name || 'Standard Shipping',
        shippingCost: parseFloat(m.shippingCost || m.cost || 0),
        estimatedDays: m.estimatedDays || m.deliveryTime || '7-21 days',
        shippingType: m.shippingType || 'standard',
      }));
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function exportToBlogAction(productId: string, couponId?: string | null) {
  try {
    if (!productId) return { success: false, error: 'productId is required' };

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!product) return { success: false, error: 'Product not found' };

    const displayName = parseProductName(product.name);
    const slug = slugify(displayName) + '-' + product.cjId.toLowerCase();

    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) return { success: false, error: 'Blog post already exists for this product', status: 409 };

    let couponData: any = null;
    let actualCouponId = couponId;

    if (!actualCouponId) {
      const now = new Date();
      // 1. Try to find a coupon specifically assigned to this product
      const specificCoupon = await prisma.coupon.findFirst({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }
          ],
          products: {
            some: {
              productCjId: product.cjId
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (specificCoupon) {
        actualCouponId = specificCoupon.id;
      } else {
        // 2. Try to find a global coupon (no product constraints)
        const globalCoupon = await prisma.coupon.findFirst({
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } }
            ],
            products: {
              none: {}
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (globalCoupon) {
          actualCouponId = globalCoupon.id;
        }
      }
    }

    if (actualCouponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: actualCouponId } });
      if (coupon && coupon.isActive) {
        if (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) {
          couponData = {
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            description: coupon.description || `Use code ${coupon.code} for savings`,
            minPurchase: coupon.minPurchase,
            expiresAt: coupon.expiresAt?.toISOString() || null,
          };
        }
      }
    }

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

    if (couponData) {
      productData.coupon = {
        code: couponData.code,
        type: couponData.type,
        value: couponData.value,
        description: couponData.description,
        minPurchase: couponData.minPurchase || undefined,
        expiresAt: couponData.expiresAt || undefined,
      };
    }

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
        couponData ? {
          code: couponData.code,
          type: couponData.type,
          value: couponData.value,
          description: couponData.description,
          minPurchase: couponData.minPurchase,
          expiresAt: couponData.expiresAt,
        } : undefined
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
        title: displayName,
        slug,
        excerpt: `Product review and details for ${displayName}. Check pricing, variants, and specifications.`,
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
        hasCoupon: !!couponData,
        hasShipping: !!(productData.shippingMethods?.length > 0),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function importProductAction(pid: string, isHero: boolean = false) {
  try {
    if (!pid) return { success: false, error: 'Product ID (pid) is required' };

    const res = await getProductDetails(pid);
    if (!res.success || !res.data) {
      return { success: false, error: res.message || 'Failed to fetch product from CJ' };
    }

    const cjProduct = res.data;

    const existing = await prisma.product.findUnique({
      where: { cjId: pid },
      include: { variants: true }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { 
          isHero: !!isHero,
          cjCategoryId: cjProduct.categoryId || existing.cjCategoryId
        }
      });
      return { success: true, message: 'Product already exists. Updated metadata.', product: { ...existing, isHero: !!isHero } };
    }

    const variantCount = cjProduct.variants.length;
    let totalStock = 0;

    const variantsData = cjProduct.variants.map((v: any) => {
      let variantStock = 100; // fallback
      if (Array.isArray(v.inventories) && v.inventories.length > 0) {
        variantStock = v.inventories.reduce((acc: number, inv: any) => acc + (Number(inv.totalInventory) || 0), 0);
      } else if (v.variantNum !== undefined) {
        variantStock = Number(v.variantNum);
      }
      totalStock += variantStock;

      return {
        cjId: v.vid,
        sku: v.variantSku,
        color: v.variantKey || v.variantNameEn || v.variantName || 'Default',
        size: '', 
        weight: v.variantWeight || 0,
        baseCost: Number(v.variantSellPrice),
        sellingPrice: Number(v.variantSellPrice), 
        inventory: variantStock, 
        image: v.variantImage || cjProduct.productImage
      };
    });

    const product = await prisma.product.create({
      data: {
        cjId: pid,
        name: cjProduct.productNameEn || cjProduct.productName,
        description: cjProduct.description,
        images: cjProduct.productImageSet && cjProduct.productImageSet.length > 0 ? cjProduct.productImageSet : [cjProduct.productImage],
        cjCategoryId: cjProduct.categoryId || null,
        variantCount,
        totalStock,
        isHero: !!isHero,
        variants: {
          create: variantsData
        }
      },
      include: {
        variants: true
      }
    });

    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
