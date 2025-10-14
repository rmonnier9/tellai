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

export * from './base-publisher';
export {
  ShopifyPublisher,
  WebflowPublisher,
  WebhookPublisher,
  WordPressPublisher,
};
