/**
 * Build fieldData object for Webflow API request
 */
export function buildFieldData(
  article: {
    title: string;
    content: string;
    description: string;
    imageUrl: string;
    createdAt: string;
  },
  slug: string,
  mapping: Record<string, string | undefined>
) {
  return Object.entries(mapping).reduce(
    (acc, [key, value]) => {
      if (value === 'title') {
        acc[key] = article.title;
      } else if (value === 'slug') {
        acc[key] = slug;
      } else if (value === 'metaDescription') {
        acc[key] = article.description || '';
      } else if (value === 'publishDate') {
        acc[key] = article.createdAt;
      } else if (value === 'mainContent') {
        acc[key] = article.content;
      } else if (value === 'image') {
        acc[key] = article.imageUrl;
      }
      return acc;
    },
    {} as Record<string, string>
  );
}
