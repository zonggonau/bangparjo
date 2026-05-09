import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/login/', '/api/'],
    },
    sitemap: 'https://bangparjo.shop/sitemap.xml',
  };
}
