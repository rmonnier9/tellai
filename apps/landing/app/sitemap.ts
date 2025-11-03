import { tools } from '@workspace/lib/data/tools';
import { MetadataRoute } from 'next';

// Liste des locales supportées
const locales = ['en', 'fr'];

// URL de base du site
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lovarank.com';

// Pages statiques principales (sans locale dans l'URL car mode 'as-needed')
const staticPages = [
  '',
  '/privacy-policy',
  '/terms-of-service',
  '/tools/blog-topic-finder',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  // Générer les URLs pour les pages statiques avec chaque locale
  for (const locale of locales) {
    for (const page of staticPages) {
      // Pour la locale par défaut (en), ne pas ajouter le préfixe de locale
      const path = locale === 'en' ? page : `/${locale}${page}`;

      urls.push({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'weekly' : 'monthly',
        priority: page === '' ? 1 : 0.5,
      });
    }

    for (const tool of tools) {
      urls.push({
        url: `${baseUrl}/tools/${tool.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
      });
    }
  }

  return urls;
}
