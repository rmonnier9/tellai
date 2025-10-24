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
    slug: string;
  },
  mapping: Record<string, string | undefined>
) {
  return Object.entries(mapping).reduce(
    (acc, [key, value]) => {
      // Map app fields to article data
      if (value === 'title') {
        acc[key] = article.title;
      } else if (value === 'slug') {
        acc[key] = article.slug;
      } else if (value === 'metaDescription') {
        acc[key] = article.description || '';
      } else if (value === 'publishDate') {
        acc[key] = article.createdAt;
      } else if (value === 'mainContent') {
        acc[key] = article.content;
      } else if (value === 'image') {
        acc[key] = article.imageUrl;
      }
      // Handle boolean values (for Bool/switch fields)
      else if (value === 'true') {
        acc[key] = true;
      } else if (value === 'false') {
        acc[key] = false;
      }
      // Handle reference IDs (for ItemRef/ItemRefSet fields)
      // If value doesn't match any known app field, treat it as a direct value
      else if (value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>
  );
}
