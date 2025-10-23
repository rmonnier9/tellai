import { marked } from 'marked';
import { BasePublisher } from './base-publisher';
import { ShopifyPublisher } from './shopify-publisher';
import { WebflowPublisher } from './webflow-publisher';
import { WebhookPublisher } from './webhook-publisher';
import { WordPressPublisher } from './wordpress-publisher';

export function getPublisher(type: string): BasePublisher | null {
  switch (type) {
    case 'shopify':
      return new ShopifyPublisher();
    case 'wordpress':
      return new WordPressPublisher();
    case 'webhook':
      return new WebhookPublisher();
    case 'webflow':
      return new WebflowPublisher();
    default:
      return null;
  }
}

export function markdownToHtml(markdown: string): string {
  // Convert markdown to HTML using marked library
  return marked.parse(markdown, {
    async: false,
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert line breaks to <br>
  }) as string;
}

export * from './base-publisher';
export {
  ShopifyPublisher,
  WebflowPublisher,
  WebhookPublisher,
  WordPressPublisher,
};
