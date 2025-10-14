import { marked } from 'marked';
import {
  ArticleData,
  BasePublisher,
  CredentialConfig,
  PublishResult,
} from './base-publisher';
import { buildFieldData, getFieldMapping } from './webflow-field-mapper';

export class WebflowPublisher extends BasePublisher {
  async publish(
    article: ArticleData,
    credential: CredentialConfig
  ): Promise<PublishResult> {
    try {
      const { collectionId, publishingStatus = 'draft' } = credential.config;
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

      // Get field mapping (allows custom field names)
      const fieldMapping = getFieldMapping(credential.config);

      // Build field data using the mapping
      const fieldData = buildFieldData(
        { title: article.title, content: htmlContent },
        slug,
        fieldMapping
      );

      // Override draft status based on publishingStatus
      fieldData._draft = publishingStatus !== 'live';

      const itemData = {
        fieldData,
      };

      console.log('Webflow API Request:', {
        collectionId,
        fieldMapping,
        fieldData: Object.keys(fieldData),
      });

      // Create the item in the collection using Webflow API v2
      const createResponse = await fetch(
        `https://api.webflow.com/v2/collections/${collectionId}/items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'accept-version': '1.0.0',
          },
          body: JSON.stringify(itemData),
        }
      );

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
        } else if (createResponse.status === 400) {
          // Provide detailed field information
          errorMessage +=
            `\n\nYour Webflow collection must have these fields:\n` +
            `1. A field for the title (we're sending as "name")\n` +
            `2. A field for the URL slug (we're sending as "slug")\n` +
            `3. A Rich Text field for content (we're sending as "post-body")\n\n` +
            `If your collection uses different field names, you may need to:\n` +
            `- Rename your fields to match: "name", "slug", "post-body"\n` +
            `- Or contact support to configure custom field mapping`;
        } else if (createResponse.status === 422) {
          errorMessage =
            `Field validation error: ${errorMessage}\n\n` +
            `Please check that your Webflow collection fields have the correct types:\n` +
            `- "name" should be Text (Plain)\n` +
            `- "slug" should be Text (Plain) and set as the collection slug\n` +
            `- "post-body" should be Rich Text`;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const createdItem = await createResponse.json();
      const itemId = createdItem.id;

      // If publishing status is 'live', publish the item
      if (publishingStatus === 'live' && itemId) {
        const publishResponse = await fetch(
          `https://api.webflow.com/v2/collections/${collectionId}/items/publish`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              'accept-version': '1.0.0',
            },
            body: JSON.stringify({
              itemIds: [itemId],
            }),
          }
        );

        if (!publishResponse.ok) {
          const errorData = await publishResponse.json().catch(() => ({}));
          // Item was created but not published - still consider it a success with a warning
          console.warn(
            `Webflow publish warning: ${errorData.message || publishResponse.statusText}`
          );
        }
      }

      // The URL structure varies based on Webflow site configuration
      // Return the slug which can be used to construct the URL
      const itemUrl = createdItem.fieldData?.slug || slug;

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
