# Article Publication System

This directory contains the publication system that automatically publishes generated articles to configured integrations.

## Architecture

### Publisher Classes

Each integration type has its own publisher class that extends `BasePublisher`:

- **ShopifyPublisher** - Publishes to Shopify blog via Admin API
- **WordPressPublisher** - Publishes to WordPress via REST API  
- **WebhookPublisher** - Sends article data to custom webhook endpoints

### How It Works

1. **Article Generation** (`generate-article-content.ts`)
   - AI generates article content
   - Article is saved with status "generated"
   - If `Product.autoPublish` is `true`, publication begins

2. **Auto-Publication Flow**
   - Fetches all Credentials linked to the Product
   - For each Credential:
     - Gets appropriate Publisher (Shopify/WordPress/Webhook)
     - Publishes article to platform
     - Creates Publication record with URL
   - Updates article status to "published" if any publication succeeds

3. **Publication Tracking**
   - Each publication is stored in the `Publication` table
   - Links: Article → Publication → Credential
   - Stores the published URL for each platform

## Usage

### Automatic Publishing

When creating an article, it will auto-publish if:
```typescript
Product.autoPublish === true
```

Publications will be created for ALL credentials attached to the product.

### Manual Publishing

You can manually publish an article by calling:
```typescript
import { getPublisher } from '@workspace/lib/publishers';

const publisher = getPublisher('shopify');
const result = await publisher.publish(articleData, credentialConfig);
```

## Publisher Interface

Each publisher must implement:

```typescript
interface BasePublisher {
  publish(
    article: ArticleData,
    credential: CredentialConfig
  ): Promise<PublishResult>;
}
```

### ArticleData
```typescript
{
  title: string;
  content: string;  // Markdown format
  keyword: string;
}
```

### PublishResult
```typescript
{
  success: boolean;
  url?: string;      // Published article URL
  error?: string;    // Error message if failed
}
```

## Platform-Specific Details

### Shopify
- Uses GraphQL Admin API
- Converts markdown to HTML
- Sets author name and publishing status
- Adds keyword as tag

### WordPress
- Uses REST API v2
- Basic Auth with Application Password
- Converts markdown to HTML
- Sets author ID and publishing status

### Webhook
- POST request with JSON payload
- Optional secret in X-Webhook-Secret header
- Custom headers support
- Returns URL from webhook response

## Database Schema

### Publication Table
```prisma
model Publication {
  id           String     @id @default(cuid())
  url          String?
  articleId    String
  article      Article    @relation(...)
  credentialId String
  credential   Credential @relation(...)
  createdAt    DateTime   @default(now())
}
```

## Adding New Publishers

To add a new platform:

1. Create new publisher class extending `BasePublisher`
2. Implement `publish()` method
3. Add to `getPublisher()` switch in `index.ts`
4. Add credential type to Prisma schema
5. Create integration form UI

Example:
```typescript
export class NotionPublisher extends BasePublisher {
  async publish(article: ArticleData, credential: CredentialConfig) {
    // Implementation
  }
}
```

