/**
 * Blog Post Detail — Full-page raw HTML render
 *
 * Route: /[slug]
 * Renders the blog post `content` field as-is (raw HTML).
 * No store layout (Navbar/Footer) — full page from top to bottom.
 * Perfect for embedding marketing HTML, landing pages, etc.
 */

import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true, image: true },
  });

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: post.image ? { images: [post.image] } : undefined,
  };
}

export default async function BlogSlugPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
  });

  if (!post) {
    notFound();
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: post.content }}
    />
  );
}
