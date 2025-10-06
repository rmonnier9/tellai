import {
  BasePublisher,
  ArticleData,
  CredentialConfig,
  PublishResult,
} from './base-publisher';

export class WordPressPublisher extends BasePublisher {
  async publish(
    article: ArticleData,
    credential: CredentialConfig
  ): Promise<PublishResult> {
    try {
      const { siteUrl, username, authorId, publishingStatus } =
        credential.config;
      const applicationPassword = credential.accessToken;

      if (!applicationPassword || !siteUrl || !username) {
        return {
          success: false,
          error: 'Missing WordPress credentials',
        };
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
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

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
