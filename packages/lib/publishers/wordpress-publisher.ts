import { marked } from 'marked';
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
    try {
      const {
        siteUrl,
        username,
        authorId,
        publishingStatus,
        applicationPassword,
      } = credential.config;

      if (!siteUrl) {
        return {
          success: false,
          error: 'WordPress site URL is required',
        };
      }

      // If username is not provided, use the simplified API key flow
      // Push to WordPress plugin REST API endpoint
      if (!username || !applicationPassword) {
        return this.publishViaPlugin(article, siteUrl, credential.accessToken);
      }

      // Convert markdown to HTML
      const htmlContent = this.markdownToHtml(article.content);

      // WordPress REST API endpoint
      const endpoint = `${siteUrl}/wp-json/wp/v2/posts`;

      // Create Basic Auth header
      const auth = Buffer.from(`${username}:${applicationPassword}`).toString(
        'base64'
      );

      const postData = {
        title: article.title,
        content: htmlContent,
        status: publishingStatus || 'draft',
        tags: [article.keyword],
        author: authorId ? parseInt(authorId) : undefined,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        try {
          const errorData = await this.safeParseJson(response);
          return {
            success: false,
            error: errorData.message || `HTTP ${response.status}`,
          };
        } catch (parseError) {
          return {
            success: false,
            error:
              parseError instanceof Error
                ? parseError.message
                : `HTTP ${response.status}`,
          };
        }
      }

      const data = await this.safeParseJson(response);

      return {
        success: true,
        url: data.link || data.guid?.rendered,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async publishViaPlugin(
    article: ArticleData,
    siteUrl: string,
    apiKey?: string | null
  ): Promise<PublishResult> {
    try {
      if (!apiKey) {
        return {
          success: false,
          error: 'API key is required for plugin publishing',
        };
      }

      // Convert markdown to HTML for WordPress
      const htmlContent = this.markdownToHtml(article.content);

      const postData = {
        secret: apiKey,
        title: article.title,
        content: htmlContent,
        slug: article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        meta_description: article.content.substring(0, 160).replace(/\n/g, ' '),
        tags: [article.keyword],
        focus_keyword: article.keyword,
        created_at: new Date().toISOString(),
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

        try {
          const errorData = await this.safeParseJson(response);
          return {
            success: false,
            error: errorData.error || `HTTP ${response.status}`,
          };
        } catch (parseError) {
          return {
            success: false,
            error:
              parseError instanceof Error
                ? parseError.message
                : `HTTP ${response.status}`,
          };
        }
      }

      const data = await this.safeParseJson(response);

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

  private markdownToHtml(markdown: string): string {
    // Convert markdown to HTML using marked library
    return marked.parse(markdown, {
      async: false,
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
    }) as string;
  }

  private async safeParseJson(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';

    // Read the response text once
    const text = await response.text();

    // Check if the response is HTML instead of JSON
    if (
      contentType.includes('text/html') ||
      text.trim().startsWith('<!DOCTYPE') ||
      text.trim().startsWith('<html')
    ) {
      // Try to extract useful error information from HTML
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      const errorTitle = titleMatch
        ? titleMatch[1]
        : 'WordPress returned an HTML page';
      throw new Error(
        `WordPress error: ${errorTitle}. The site may be misconfigured or the REST API may be disabled.`
      );
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(
        `Invalid JSON response from WordPress. Response: ${text.substring(0, 100)}...`
      );
    }
  }
}
