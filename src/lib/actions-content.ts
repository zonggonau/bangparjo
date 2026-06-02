'use server';

import { prisma } from '@/lib/db';
import { notifyContactAdmin } from '@/lib/openclaw';

export async function submitContactFormAction(data: any) {
  try {
    const { name, email, subject, message } = data;

    if (!name || !email || !message) {
      return { success: false, error: 'Data tidak lengkap' };
    }

    // Save to database
    try {
      await (prisma as any).supportTicket.create({
        data: { name, email, subject, message }
      });
    } catch {
      await prisma.$executeRaw`
        INSERT INTO "SupportTicket" (id, name, email, subject, message, status, "createdAt", "updatedAt")
        VALUES (
          ${Math.random().toString(36).substring(2)}, 
          ${name}, 
          ${email}, 
          ${subject}, 
          ${message}, 
          'OPEN', 
          NOW(), 
          NOW()
        )
      `;
    }

    // Kirim notifikasi WA ke admin
    notifyContactAdmin({ name, email, subject, message })
      .catch(err => console.warn('[OpenClaw] Notif contact gagal:', err));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Gagal mengirim pesan' };
  }
}

export async function getBlogPostsAction(slug?: string) {
  try {
    if (slug) {
      const post = await prisma.blogPost.findUnique({
        where: { slug, published: true },
      });
      if (!post) return { success: false, error: 'Post not found' };
      return { success: true, data: post };
    }

    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        author: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: posts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAboutContentAction() {
  try {
    const about = await prisma.aboutPage.findFirst({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!about) return { success: false, error: 'About page not found' };

    return { success: true, data: about };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function subscribeNewsletterAction(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Invalid email address.' };
    }

    // Check if already exists in the database
    const existing = await prisma.subscriber.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      if (existing.isActive) {
        return { success: true, message: 'You are already subscribed.' };
      } else {
        // Reactivate subscriber
        await prisma.subscriber.update({
          where: { email: cleanEmail },
          data: { isActive: true }
        });
        return { success: true, message: 'Successfully subscribed.' };
      }
    }

    // Save as new subscriber
    await prisma.subscriber.create({
      data: {
        email: cleanEmail,
        isActive: true
      }
    });

    return { success: true, message: 'Successfully subscribed.' };
  } catch (error: any) {
    console.error('[SUBSCRIBE] Error:', error);
    return { success: false, error: 'Failed to subscribe. Please try again.' };
  }
}
