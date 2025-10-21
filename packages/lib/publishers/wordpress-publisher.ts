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
        // Yoast SEO meta fields (if Yoast is installed)
        yoast_meta: article.metaDescription
          ? {
              yoast_wpseo_metadesc: article.metaDescription,
              yoast_wpseo_focuskw: article.keyword,
            }
          : undefined,
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
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      // If Yoast meta wasn't accepted in the initial request and we have a meta description,
      // try to update the post meta separately for SEO plugins
      if (article.metaDescription && data.id) {
        try {
          // Try to update Yoast SEO meta fields
          await fetch(`${siteUrl}/wp-json/wp/v2/posts/${data.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
              meta: {
                _yoast_wpseo_metadesc: article.metaDescription,
                _yoast_wpseo_focuskw: article.keyword,
              },
            }),
          });
        } catch (error) {
          // Silently fail if meta update doesn't work
          // The post was still created successfully
          console.warn('Could not set SEO meta fields:', error);
        }
      }

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

      // Upload featured image if provided
      let featuredMediaId: number | undefined;
      if (article.imageUrl) {
        try {
          featuredMediaId = await this.uploadImageViaWordPressAPI(
            article.imageUrl,
            article.title,
            siteUrl,
            apiKey
          );
        } catch (error) {
          console.warn('Failed to upload featured image:', error);
          // Continue without featured image rather than failing the whole publish
        }
      }

      const postData = {
        secret: apiKey,
        title: article.title,
        content: htmlContent,
        slug: article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        meta_description:
          article.metaDescription ||
          article.content.substring(0, 160).replace(/\n/g, ' '),
        featured_media: featuredMediaId,
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

  /**
   * Upload image to WordPress Media Library using Lovarank plugin endpoint
   */
  private async uploadImageViaWordPressAPI(
    imageUrl: string,
    title: string,
    siteUrl: string,
    apiKey: string
  ): Promise<number> {
    // Fetch the image from S3/external URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get('content-type') || 'image/jpeg';

    // Extract filename from URL or generate from title
    const urlParts = imageUrl.split('/');
    const urlFilename = urlParts[urlParts.length - 1];
    let filename: string;

    // If filename doesn't have an extension, add one based on content type
    if (!urlFilename || !urlFilename.includes('.')) {
      const ext = contentType.split('/')[1] || 'jpg';
      filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;
    } else {
      filename = urlFilename;
    }

    // Upload to WordPress Media Library using Lovarank plugin endpoint
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: contentType });
    formData.append('file', blob, filename);
    formData.append('title', title);

    // Try pretty permalinks first
    let uploadEndpoint = `${siteUrl}/wp-json/lovarank/v1/upload-image`;
    let uploadResponse = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: formData,
    });

    // If 404, try query parameter method (for Plain permalinks)
    if (uploadResponse.status === 404) {
      uploadEndpoint = `${siteUrl}/?rest_route=/lovarank/v1/upload-image`;
      uploadResponse = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      });
    }

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `Failed to upload image to WordPress: ${uploadResponse.status} - ${errorText}`
      );
    }

    const responseData = await uploadResponse.json();

    if (!responseData.success || !responseData.id) {
      throw new Error(
        `WordPress image upload failed: ${responseData.error || 'Unknown error'}`
      );
    }

    return responseData.id;
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
