import { markdownToHtml } from '.';
import {
  ArticleData,
  BasePublisher,
  CredentialConfig,
  PublishResult,
} from './base-publisher';

export class WordPressPublisher extends BasePublisher {
  async publish(
    article: ArticleData,
    credential: CredentialConfig
  ): Promise<PublishResult> {
    const { siteUrl } = credential.config;

    if (!siteUrl) {
      return {
        success: false,
        error: 'WordPress site URL is required',
      };
    }

    try {
      const apiKey = credential.accessToken;
      if (!apiKey) {
        return {
          success: false,
          error: 'API key is required for plugin publishing',
        };
      }

      // Convert markdown to HTML
      const htmlContent = markdownToHtml(article.content);

      const publishingStatus = credential.config.publishingStatus || 'draft';

      const postData = {
        secret: apiKey,
        title: article.title,
        content: htmlContent,
        meta_description: article.metaDescription,
        focus_keyword: article.keyword,
        slug: article.slug,
        image_url: article.imageUrl,
        publishing_status: publishingStatus,
        // tags: [],
        // author: article.author,
        // category: article.category,
        created_at: article.createdAt,
      };

      // Try pretty permalinks first (works with most permalink structures)
      let endpoint = `${siteUrl}/wp-json/lovarank/v1/submit`;
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      // If 404, try the query parameter method (works with Plain permalinks)
      if (response.status === 404) {
        endpoint = `${siteUrl}/?rest_route=/lovarank/v1/submit`;
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        // Still 404 after both attempts - plugin not found/activated
        if (response.status === 404) {
          return {
            success: false,
            error:
              'WordPress plugin not found. Please ensure the Lovarank plugin is installed and activated on your WordPress site.',
          };
        }

        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Unknown error from WordPress plugin',
        };
      }

      // Get the post URL from WordPress
      const postUrl = `${siteUrl}/?p=${data.post_id}`;

      return {
        success: true,
        url: postUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
