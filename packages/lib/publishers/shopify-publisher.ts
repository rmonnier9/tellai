import {
  BasePublisher,
  ArticleData,
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
      const htmlContent = this.markdownToHtml(article.content);

      // Shopify Admin API endpoint
      const endpoint = `https://${sanitizedStoreName}.myshopify.com/admin/api/2024-01/graphql.json`;

      // GraphQL mutation to create a blog post
      const mutation = `
        mutation createBlogArticle($article: ArticleCreateInput!) {
          articleCreate(article: $article) {
            article {
              id
              handle
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      // Format blogId to Shopify GID format if it's just a number
      let formattedBlogId = blogId;
      if (blogId && !blogId.startsWith('gid://')) {
        formattedBlogId = `gid://shopify/Blog/${blogId}`;
      }

      if (!formattedBlogId) {
        return {
          success: false,
          error:
            'Blog ID is required. Please specify a blog ID in your Shopify integration settings.',
        };
      }

      const variables = {
        article: {
          blogId: formattedBlogId,
          title: article.title,
          body: htmlContent,
          author: {
            name: authorName,
          },
          isPublished: publishingStatus === 'published',
          tags: [article.keyword],
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query: mutation, variables }),
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
          error: data.errors[0]?.message || 'Shopify API error',
        };
      }

      const result = data.data?.articleCreate;

      if (result?.userErrors?.length > 0) {
        return {
          success: false,
          error: result.userErrors[0].message,
        };
      }

      // Construct the blog URL from the handle
      const blogUrl = result?.article?.handle
        ? `https://${sanitizedStoreName}.myshopify.com/blogs/news/${result.article.handle}`
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

  private markdownToHtml(markdown: string): string {
    // Basic markdown to HTML conversion
    // In production, use a proper library like 'marked' or 'remark'
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gim, '<p>$1</p>')
      .replace(/<p><h/g, '<h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>');
  }
}
