import { MetadataRoute } from 'next';
import { ALL_DOC_PAGES } from '@/lib/docs-nav';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://notifyiq.app';
  const currentDate = new Date();

  // Root and Legal Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/data-deletion`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Dynamic documentation pages
  const docPages: MetadataRoute.Sitemap = ALL_DOC_PAGES.map((doc) => ({
    url: `${baseUrl}${doc.href}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...docPages];
}
