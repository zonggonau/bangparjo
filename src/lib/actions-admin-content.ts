'use server';

import { prisma } from '@/lib/db';
import { revalidateTag } from 'next/cache';

// --- ABOUT PAGE ---
export async function getAdminAboutAction() {
  try {
    const about = await prisma.aboutPage.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: about };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveAdminAboutAction(data: any) {
  try {
    const { id, title, content, image, mission, vision, published } = data;
    if (!content) return { success: false, error: 'content is required' };

    let about;
    if (id) {
      about = await prisma.aboutPage.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(image !== undefined && { image }),
          ...(mission !== undefined && { mission }),
          ...(vision !== undefined && { vision }),
          ...(published !== undefined && { published }),
        },
      });
    } else {
      const existing = await prisma.aboutPage.findFirst();
      if (existing) return { success: false, error: 'About page already exists. Use update.' };
      
      about = await prisma.aboutPage.create({
        data: {
          title: title || 'About Us',
          content,
          image: image || null,
          mission: mission || null,
          vision: vision || null,
          published: published ?? true,
        },
      });
    }

    try { revalidateTag('', { expire: 0 }); } catch (e) {}
    return { success: true, data: about };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminAboutAction(id: string) {
  try {
    if (!id) return { success: false, error: 'id is required' };
    await prisma.aboutPage.delete({ where: { id } });
    try { revalidateTag('', { expire: 0 }); } catch (e) {}
    return { success: true, message: 'About page deleted' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- BLOG ---
export async function getAdminBlogPostsAction(id?: string) {
  try {
    if (id) {
      const post = await prisma.blogPost.findUnique({ where: { id } });
      if (!post) return { success: false, error: 'Post not found' };
      return { success: true, data: post };
    }
    const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data: posts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveAdminBlogPostAction(data: any) {
  try {
    const { id, title, slug, excerpt, content, image, author, published } = data;

    if (!id) {
      if (!title || !slug || !content) return { success: false, error: 'title, slug, and content are required' };
      const existing = await prisma.blogPost.findUnique({ where: { slug } });
      if (existing) return { success: false, error: 'A post with this slug already exists' };

      const post = await prisma.blogPost.create({
        data: {
          title, slug, excerpt: excerpt || null, content, image: image || null, author: author || 'Admin', published: published ?? false,
        },
      });
      try { revalidateTag('', { expire: 0 }); } catch (e) {}
      return { success: true, data: post };
    } else {
      const existing = await prisma.blogPost.findUnique({ where: { id } });
      if (!existing) return { success: false, error: 'Post not found' };

      if (slug && slug !== existing.slug) {
        const slugConflict = await prisma.blogPost.findUnique({ where: { slug } });
        if (slugConflict) return { success: false, error: 'A post with this slug already exists' };
      }

      const post = await prisma.blogPost.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(slug !== undefined && { slug }),
          ...(excerpt !== undefined && { excerpt }),
          ...(content !== undefined && { content }),
          ...(image !== undefined && { image }),
          ...(author !== undefined && { author }),
          ...(published !== undefined && { published }),
        },
      });

      try {
        revalidateTag('content:about', { expire: 0 });
        revalidateTag('blog:post:' + existing.slug, { expire: 0 });
      } catch (e) {}
      return { success: true, data: post };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminBlogPostAction(id: string) {
  try {
    if (!id) return { success: false, error: 'id is required' };
    await prisma.blogPost.delete({ where: { id } });
    try { revalidateTag('', { expire: 0 }); } catch (e) {}
    return { success: true, message: 'Post deleted' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- COUPON ---
export async function saveAdminCouponAction(data: any) {
  try {
    const { id, code, type, value, minPurchase, maxUses, isActive, expiresAt, description, productCjIds } = data;

    if (!id) {
      if (!code || value === undefined || value === null) return { success: false, error: 'Code and value are required' };
      const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (existing) return { success: false, error: 'Coupon code already exists' };

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(), type: type || 'PERCENTAGE', value: parseFloat(value),
          minPurchase: minPurchase ? parseFloat(minPurchase) : null,
          maxUses: maxUses ? parseInt(maxUses) : null,
          isActive: isActive !== undefined ? isActive : true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          description: description || null,
          products: { create: (productCjIds || []).map((cjId: string) => ({ productCjId: cjId })) },
        },
        include: { products: true },
      });
      return { success: true, data: coupon };
    } else {
      const updateData: any = {};
      if (code !== undefined) updateData.code = code.toUpperCase();
      if (type !== undefined) updateData.type = type;
      if (value !== undefined) updateData.value = parseFloat(value);
      if (minPurchase !== undefined) updateData.minPurchase = minPurchase ? parseFloat(minPurchase) : null;
      if (maxUses !== undefined) updateData.maxUses = maxUses ? parseInt(maxUses) : null;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (description !== undefined) updateData.description = description;

      await prisma.coupon.update({ where: { id }, data: updateData });

      if (productCjIds !== undefined) {
        await prisma.couponProduct.deleteMany({ where: { couponId: id } });
        if (productCjIds.length > 0) {
          await prisma.couponProduct.createMany({
            data: productCjIds.map((cjId: string) => ({ couponId: id, productCjId: cjId })),
          });
        }
      }

      const updated = await prisma.coupon.findUnique({ where: { id }, include: { products: true } });
      return { success: true, data: updated };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminCouponAction(id: string) {
  try {
    if (!id) return { success: false, error: 'Coupon ID is required' };
    await prisma.coupon.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- SUBSCRIBERS ---
export async function getAdminSubscribersAction() {
  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: subscribers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminSubscriberAction(id: string) {
  try {
    if (!id) return { success: false, error: 'ID is required' };
    await prisma.subscriber.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


