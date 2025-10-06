'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';
import { CredentialType } from '@prisma/client';
import {
  ShopifyCredentialSchema,
  WordPressCredentialSchema,
  WebhookCredentialSchema,
} from '../dtos';

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
      credentialData = {
        type: 'wordpress' as CredentialType,
        name: wpData.name,
        accessToken: wpData.applicationPassword,
        config: {
          siteUrl: wpData.siteUrl,
          username: wpData.username,
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
