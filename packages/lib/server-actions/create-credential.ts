'use server';

import prisma, { CredentialType } from '@workspace/db/prisma/client';
import {
  ShopifyCredentialSchema,
  WebflowCredentialSchema,
  WebhookCredentialSchema,
  WordPressCredentialSchema,
} from '../dtos';
import getSession from '../get-session';

type CreateCredentialInput =
  | {
      type: 'shopify';
      data: typeof ShopifyCredentialSchema._type;
    }
  | {
      type: 'wordpress';
      data: typeof WordPressCredentialSchema._type;
    }
  | {
      type: 'webhook';
      data: typeof WebhookCredentialSchema._type;
    }
  | {
      type: 'webflow';
      data: typeof WebflowCredentialSchema._type;
    };

export async function createCredential(input: CreateCredentialInput) {
  const session = await getSession();

  if (!session?.session) {
    throw new Error('Unauthorized');
  }

  const activeProductId = (session.session as any).activeProductId;

  if (!activeProductId) {
    throw new Error('No active product');
  }

  let credentialData;

  switch (input.type) {
    case 'shopify':
      const shopifyData = ShopifyCredentialSchema.parse(input.data);
      credentialData = {
        type: 'shopify' as CredentialType,
        name: shopifyData.name,
        accessToken: shopifyData.accessToken,
        config: {
          storeName: shopifyData.storeName,
          blogId: shopifyData.blogId,
          authorName: shopifyData.authorName,
          publishingStatus: shopifyData.publishingStatus,
        },
      };
      break;

    case 'wordpress':
      const wpData = WordPressCredentialSchema.parse(input.data);
      // If username is not provided, use the application password as the API key
      // Otherwise generate a unique API key for WordPress plugin to fetch articles
      const apiKey = wpData.username
        ? `wp_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        : wpData.applicationPassword; // In simplified flow, applicationPassword is the API key

      credentialData = {
        type: 'wordpress' as CredentialType,
        name: wpData.name,
        accessToken: apiKey, // API key for WordPress plugin to fetch articles
        config: {
          siteUrl: wpData.siteUrl,
          username: wpData.username || '',
          applicationPassword: wpData.applicationPassword,
          authorId: wpData.authorId,
          publishingStatus: wpData.publishingStatus,
        },
      };
      break;

    case 'webhook':
      const webhookData = WebhookCredentialSchema.parse(input.data);
      credentialData = {
        type: 'webhook' as CredentialType,
        name: webhookData.name,
        config: {
          webhookUrl: webhookData.webhookUrl,
          secret: webhookData.secret,
          headers: webhookData.headers ? JSON.parse(webhookData.headers) : null,
        },
      };
      break;

    case 'webflow':
      const webflowData = WebflowCredentialSchema.parse(input.data);
      credentialData = {
        type: 'webflow' as CredentialType,
        name: webflowData.name,
        accessToken: webflowData.accessToken,
        config: {
          collectionId: webflowData.collectionId,
          siteUrl: webflowData.siteUrl,
          publishingStatus: webflowData.publishingStatus,
          fieldMapping: webflowData.fieldMapping,
        },
      };
      break;

    default:
      throw new Error('Invalid credential type');
  }

  return prisma.credential.create({
    data: {
      ...credentialData,
      productId: activeProductId,
    },
  });
}

export default createCredential;
