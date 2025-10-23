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
      const htmlContent = this.markdownToHtml(article.content);

      // Generate slug from title
      const slug = article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const postData = {
        secret: apiKey,
        title: article.title,
        content: htmlContent,
        meta_description: article.metaDescription,
        focus_keyword: article.keyword,
        slug,
        image_url: article.imageUrl,
        // tags: [],
        // author: article.author,
        // category: article.category,
        created_at: new Date().toISOString(),
      };

      console.log('Post data:', { ...postData, content: '' });

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
