import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/cart`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/track`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/favorites`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/help-center`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${baseUrl}/refund`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
  ];

  // Categories from DB
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      select: { slug: true },
    });
    categoryRoutes = categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch (e) {
    // Fallback if DB not ready
    const fallbackCats = [
      'womens-clothing', 'mens-clothing', 'electronics', 'home-kitchen',
      'beauty', 'sports', 'toys', 'jewelry', 'bags', 'shoes',
    ];
    categoryRoutes = fallbackCats.map((slug) => ({
      url: `${baseUrl}/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  }

  // Products from DB (top 1000 for sitemap)
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { isHero: true },
      select: { cjId: true, name: true, updatedAt: true },
      take: 1000,
      orderBy: { updatedAt: 'desc' },
    });

    productRoutes = products.map((p) => {
      const slug = p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
      return {
        url: `${baseUrl}/product/${p.cjId}/${slug}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });
  } catch (e) {
    // Products optional
  }

  return [...staticPages, ...categoryRoutes, ...productRoutes];
}
