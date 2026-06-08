import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { parseProductData } from '@/lib/blog-templates';
import BlogDetailClient from './BlogDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';

  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
  });

  if (!post) {
    return { title: 'Post Not Found' };
  }

  // Try to extract AI content from product JSON
  let seoTitle = post.title;
  let seoDescription = post.excerpt || '';
  let ogImage = post.image || '';

  const productData = parseProductData(post.content);
  if (productData) {
    const ai = (productData as any).ai || {};
    if (ai.seoTitle) seoTitle = ai.seoTitle;
    if (ai.seoDescription) seoDescription = ai.seoDescription.substring(0, 160);
    // Use product image from blog post (already saved correctly)
    if (!ogImage && productData.images?.[0]) {
      ogImage = productData.images[0];
    }
  }

  const ogTitle = seoTitle;
  const ogDescription = seoDescription || post.excerpt || '';
  const canonicalUrl = `${baseUrl}/blog/${slug}`;

  return {
    title: ogTitle,
    description: ogDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      url: canonicalUrl,
      siteName: 'BangParjo Shop',
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 800,
              height: 800,
              alt: ogTitle,
            },
          ]
        : [
            {
              url: `${baseUrl}/logo-banner.png`,
              width: 800,
              height: 800,
              alt: 'BangParjo Shop',
            },
          ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : [`${baseUrl}/logo-banner.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
  });

  if (!post) {
    notFound();
  }

  return <BlogDetailClient slug={slug} />;
}
