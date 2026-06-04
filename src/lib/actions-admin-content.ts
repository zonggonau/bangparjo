'use server';

import { prisma } from '@/lib/db';
import { revalidateTag } from 'next/cache';
import { auth } from '@/auth';

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return session;
}

// --- ABOUT PAGE ---
export async function getAdminAboutAction() {
  try {
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
    if (!id) return { success: false, error: 'ID is required' };
    await prisma.subscriber.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminCustomerAction(id: string) {
  try {
    await checkAdmin();
    if (!id) return { success: false, error: 'ID is required' };
    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendBroadcastEmailAction(subject: string, content: string) {
  try {
    await checkAdmin();
    if (!subject || !content) {
      return { success: false, error: 'Subject and content are required' };
    }

    // 1. Get all customer emails (role === 'USER')
    const customers = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { email: true }
    });

    // 2. Get all active subscriber emails
    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
      select: { email: true }
    });

    // Combine and deduplicate emails
    const emailSet = new Set<string>();
    
    customers.forEach(c => {
      if (c.email) emailSet.add(c.email.trim().toLowerCase());
    });
    subscribers.forEach(s => {
      if (s.email) emailSet.add(s.email.trim().toLowerCase());
    });

    const allRecipients = Array.from(emailSet);

    if (allRecipients.length === 0) {
      return { success: false, error: 'No customers or active subscribers found to email.' };
    }

    // 3. Send email broadcast
    const { sendBroadcastEmail } = await import('@/lib/mail');
    const res = await sendBroadcastEmail(allRecipients, subject, content);
    
    return { 
      success: res.success, 
      successCount: res.successCount, 
      failCount: res.failCount,
      message: `Broadcast complete. Sent: ${res.successCount}, Failed: ${res.failCount}`
    };
  } catch (error: any) {
    console.error('[BROADCAST_ACTION] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBlogBroadcastAction(postTitle: string, postUrl: string, customMessage: string) {
  try {
    await checkAdmin();
    if (!postTitle || !postUrl) {
      return { success: false, error: 'Post title and URL are required' };
    }

    // 1. Get all customer emails (role === 'USER')
    const customers = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { email: true }
    });

    // 2. Get all active subscriber emails
    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
      select: { email: true }
    });

    // Combine and deduplicate
    const emailSet = new Set<string>();
    customers.forEach(c => { if (c.email) emailSet.add(c.email.trim().toLowerCase()); });
    subscribers.forEach(s => { if (s.email) emailSet.add(s.email.trim().toLowerCase()); });

    const allRecipients = Array.from(emailSet);

    if (allRecipients.length === 0) {
      return { success: false, error: 'No customers or active subscribers found.' };
    }

    // Build HTML email body
    const subject = `New Article: ${postTitle} - BangParjo Shop`;
    const htmlContent = `
      <p>Hello there!</p>
      <p>We have just published a brand new article on our blog:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #222; font-size: 16px;">${postTitle}</h4>
        ${customMessage ? `<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.5;">${customMessage.replace(/\n/g, '<br/>')}</p>` : ''}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${postUrl}" style="background-color: #ff6b00; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 2px 5px rgba(255,107,0,0.2);">
          Read the Article
        </a>
      </div>

      <p style="font-size: 12px; color: #777; text-align: center;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${postUrl}" style="color: #ff6b00;">${postUrl}</a>
      </p>
    `;

    const { sendBroadcastEmail } = await import('@/lib/mail');
    const res = await sendBroadcastEmail(allRecipients, subject, htmlContent);

    return {
      success: res.success,
      successCount: res.successCount,
      failCount: res.failCount,
      message: `Broadcast complete. Sent: ${res.successCount}, Failed: ${res.failCount}`
    };
  } catch (error: any) {
    console.error('[BLOG_BROADCAST] Error:', error);
    return { success: false, error: error.message };
  }
}


