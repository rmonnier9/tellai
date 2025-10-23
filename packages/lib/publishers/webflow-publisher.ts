import { marked } from 'marked';
import {
  ArticleData,
  BasePublisher,
  CredentialConfig,
  PublishResult,
} from './base-publisher';
import { buildFieldData } from './webflow-field-mapper';

export class WebflowPublisher extends BasePublisher {
  async publish(
    article: ArticleData,
    credential: CredentialConfig
  ): Promise<PublishResult> {
    try {
      const { collectionId, siteUrl, publishingStatus } = credential.config;
      const accessToken = credential.accessToken;

      if (!accessToken) {
        return {
          success: false,
          error: 'Webflow API token is required',
        };
      }

      if (!collectionId) {
        return {
          success: false,
          error:
            'Webflow collection ID is required. Please specify the collection ID for your blog posts.',
        };
      }

      // Convert markdown to HTML
      const htmlContent = this.markdownToHtml(article.content);

      // Generate slug from title
      const slug = article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const fieldData = buildFieldData(
        {
          title: article.title,
          content: htmlContent,
          description: article.metaDescription,
          imageUrl: article.imageUrl,
          createdAt: article.createdAt,
        },
        slug,
        credential.config.fieldMapping
      );

      const itemData = {
        fieldData,
        isArchived: false,
        isDraft: publishingStatus === 'draft',
      };

      const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${publishingStatus === 'live' ? 'live' : 'bulk'}?skipInvalidFiles=true`;
      const createResponse = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));

        // Log the full error for debugging
        console.error('Webflow API Error:', {
          status: createResponse.status,
          statusText: createResponse.statusText,
          errorData,
        });

        // Provide helpful error messages
        let errorMessage =
          errorData.message ||
          errorData.msg ||
          errorData.err ||
          `HTTP ${createResponse.status}: ${createResponse.statusText}`;

        // Check if there are field errors in the response
        const fieldErrors = errorData.fieldErrors || errorData.errors;
        if (fieldErrors && Array.isArray(fieldErrors)) {
          const fieldNames = fieldErrors
            .map((e: any) => e.field || e.name)
            .filter(Boolean);
          if (fieldNames.length > 0) {
            errorMessage = `Missing or invalid fields: ${fieldNames.join(', ')}. `;
          }
        }

        if (createResponse.status === 401) {
          errorMessage =
            'Invalid API token. Please check your Webflow API token in your integration settings.';
        } else if (createResponse.status === 404) {
          errorMessage =
            'Collection not found. Please verify your collection ID in your integration settings.';
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const createdItem = await createResponse.json();

      // Construct the full URL if siteUrl is provided
      // Otherwise just return the slug
      const articleSlug = createdItem.fieldData?.slug || slug;
      let itemUrl = articleSlug;

      if (siteUrl) {
        // Remove trailing slash from siteUrl
        const baseUrl = siteUrl.replace(/\/$/, '');
        // Construct full URL (common Webflow blog structure)
        // You may need to adjust the path based on your Webflow collection settings
        itemUrl = `${baseUrl}/blog/${articleSlug}`;

        console.log('Constructed Webflow article URL:', itemUrl);
      } else {
        console.log('No siteUrl configured, returning slug only:', itemUrl);
      }

      return {
        success: true,
        url: itemUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private markdownToHtml(markdown: string): string {
    // Convert markdown to HTML using marked library
    return marked.parse(markdown, {
      async: false,
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
    }) as string;
  }
}
