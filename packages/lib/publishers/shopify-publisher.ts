import { markdownToHtml } from '.';
import {
  ArticleData,
  BasePublisher,
  CredentialConfig,
  PublishResult,
} from './base-publisher';

export class ShopifyPublisher extends BasePublisher {
  async publish(
    article: ArticleData,
    credential: CredentialConfig
  ): Promise<PublishResult> {
    try {
      const { storeName, blogId, authorName, publishingStatus } =
        credential.config;
      const accessToken = credential.accessToken;

      if (!accessToken || !storeName) {
        return {
          success: false,
          error: 'Missing Shopify credentials',
        };
      }

      // Sanitize store name (remove spaces, convert to lowercase, remove special chars)
      const sanitizedStoreName = storeName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      if (!sanitizedStoreName) {
        return {
          success: false,
          error:
            'Invalid store name. Store name should only contain letters, numbers, and hyphens.',
        };
      }

      // Convert markdown to HTML (simple conversion - you may want to use a library)
      const htmlContent = markdownToHtml(article.content);

      // Format blogId to extract numeric ID
      let numericBlogId = blogId;
      if (blogId && blogId.startsWith('gid://')) {
        numericBlogId = blogId.replace('gid://shopify/Blog/', '');
      }

      if (!numericBlogId) {
        return {
          success: false,
          error:
            'Blog ID is required. Please specify a blog ID in your Shopify integration settings.',
        };
      }

      // Shopify Admin API REST endpoint
      const endpoint = `https://${sanitizedStoreName}.myshopify.com/admin/api/2024-01/blogs/${numericBlogId}/articles.json`;

      const articleData = {
        article: {
          title: article.title,
          body_html: htmlContent,
          author: authorName,
          published: publishingStatus === 'published',
          tags: article.keyword,
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Shopify API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      if (data.errors) {
        return {
          success: false,
          error: data.errors || 'Shopify API error',
        };
      }

      // Construct the blog URL from the handle
      const articleHandle = data.article?.handle;
      const blogUrl = articleHandle
        ? `https://${sanitizedStoreName}.myshopify.com/blogs/news/${articleHandle}`
        : undefined;

      return {
        success: true,
        url: blogUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
