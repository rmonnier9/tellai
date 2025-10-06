import {
  BasePublisher,
  ArticleData,
  CredentialConfig,
  PublishResult,
} from './base-publisher';

export class WebhookPublisher extends BasePublisher {
  async publish(
    article: ArticleData,
    credential: CredentialConfig
  ): Promise<PublishResult> {
    try {
      const { webhookUrl, secret, headers: customHeaders } = credential.config;

      if (!webhookUrl) {
        return {
          success: false,
          error: 'Missing webhook URL',
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add secret to headers if provided
      if (secret) {
        headers['X-Webhook-Secret'] = secret;
      }

      // Add custom headers if provided
      if (customHeaders && typeof customHeaders === 'object') {
        Object.assign(headers, customHeaders);
      }

      const payload = {
        title: article.title,
        content: article.content,
        keyword: article.keyword,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Webhook failed: ${response.status} - ${errorText}`,
        };
      }

      // Try to parse response for URL
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { success: true };
      }

      return {
        success: true,
        url: responseData.url || responseData.publishUrl || webhookUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
