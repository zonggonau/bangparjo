import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bangparjo.shop';

  const categories = [
    'womens-clothing',
    'mens-clothing',
    'electronics',
    'home-kitchen',
    'beauty',
    'sports',
    'toys',
    'jewelry',
    'bags',
    'shoes',
    'pet-supplies',
    'health',
  ];

  const categoryRoutes = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/track`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...categoryRoutes,
  ];
}
