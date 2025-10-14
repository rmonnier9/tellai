/**
 * Webflow Field Mapper
 *
 * This utility helps map article data to Webflow collection fields.
 * Different Webflow collections may use different field names.
 */

export interface WebflowFieldMapping {
  titleField?: string; // Default: "name"
  slugField?: string; // Default: "slug"
  contentField?: string; // Default: "post-body"
  excerptField?: string; // Optional
  authorField?: string; // Optional
  dateField?: string; // Optional
  imageField?: string; // Optional
}

export const DEFAULT_FIELD_MAPPING: WebflowFieldMapping = {
  titleField: 'name',
  slugField: 'slug',
  contentField: 'post-body',
};

/**
 * Common alternative field names used in Webflow collections
 */
export const COMMON_WEBFLOW_FIELDS = {
  title: ['name', 'title', 'post-name', 'article-title', 'heading'],
  slug: ['slug', 'url-slug', 'post-slug'],
  content: [
    'post-body',
    'body',
    'content',
    'article-content',
    'rich-text',
    'main-content',
  ],
  excerpt: ['excerpt', 'summary', 'description', 'post-summary'],
  author: ['author', 'author-name', 'writer'],
  date: ['date', 'publish-date', 'created-date', 'post-date'],
  image: ['main-image', 'featured-image', 'thumbnail', 'post-image'],
};

/**
 * Get field mapping from credential config or use defaults
 */
export function getFieldMapping(config: any): WebflowFieldMapping {
  return {
    titleField:
      config?.fieldMapping?.titleField || DEFAULT_FIELD_MAPPING.titleField,
    slugField:
      config?.fieldMapping?.slugField || DEFAULT_FIELD_MAPPING.slugField,
    contentField:
      config?.fieldMapping?.contentField || DEFAULT_FIELD_MAPPING.contentField,
    excerptField: config?.fieldMapping?.excerptField,
    authorField: config?.fieldMapping?.authorField,
    dateField: config?.fieldMapping?.dateField,
    imageField: config?.fieldMapping?.imageField,
  };
}

/**
 * Build fieldData object for Webflow API request
 */
export function buildFieldData(
  article: { title: string; content: string },
  slug: string,
  mapping: WebflowFieldMapping
) {
  const fieldData: Record<string, any> = {};

  // Required fields
  if (mapping.titleField) {
    fieldData[mapping.titleField] = article.title;
  }

  if (mapping.slugField) {
    fieldData[mapping.slugField] = slug;
  }

  if (mapping.contentField) {
    fieldData[mapping.contentField] = article.content;
  }

  // Always include these Webflow system fields
  fieldData._draft = false;
  fieldData._archived = false;

  // Optional fields
  if (mapping.excerptField) {
    // Create excerpt from content (first 160 characters)
    const plainText = article.content.replace(/<[^>]*>/g, '').substring(0, 160);
    fieldData[mapping.excerptField] = plainText;
  }

  if (mapping.dateField) {
    fieldData[mapping.dateField] = new Date().toISOString();
  }

  return fieldData;
}
