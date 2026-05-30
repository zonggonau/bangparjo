'use server';

import { prisma } from '@/lib/db';
import { cjFetch, getProductDetails, CJProductDetail } from '@/lib/cj';
import { revalidateTag } from 'next/cache';
import { slugify, parseProductName } from '@/lib/utils';
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
    const res = await cjFetch<CJProductDetail>(`/v1/product/query?pid=${cjId}`, { method: 'GET' });
    if (!res.result) return { success: false, error: 'Product not found in CJ' };

    const cjProduct = res.data;
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
    if (couponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
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

export async function importProductAction(
  productData: { pid: string; name: string; image: string; sellPrice: number; categoryName?: string },
  isHero: boolean = false
) {
  try {
    const { pid, name, image, sellPrice, categoryName } = productData;
    if (!pid) return { success: false, error: 'Product ID (pid) is required' };

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
            baseCost: Number(sellPrice),
            sellingPrice: Number(sellPrice), 
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

    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
