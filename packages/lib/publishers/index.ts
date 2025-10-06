import { BasePublisher } from './base-publisher';
import { ShopifyPublisher } from './shopify-publisher';
import { WordPressPublisher } from './wordpress-publisher';
import { WebhookPublisher } from './webhook-publisher';

export function getPublisher(type: string): BasePublisher | null {
  switch (type) {
    case 'shopify':
      return new ShopifyPublisher();
    case 'wordpress':
      return new WordPressPublisher();
    case 'webhook':
      return new WebhookPublisher();
    default:
      return null;
  }
}

export * from './base-publisher';
export { ShopifyPublisher, WordPressPublisher, WebhookPublisher };
