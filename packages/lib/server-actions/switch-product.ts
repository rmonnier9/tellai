'use server';

import { auth } from '@workspace/auth/server';
import { headers } from 'next/headers';
import prisma from '@workspace/db/prisma/client';

export async function switchProduct(productId: string) {
  try {
    // Get the current session directly using better-auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        error: 'Unauthorized - no session found',
      };
    }

    // Validate that the user has access to this product
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        organization: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: 'Product not found or access denied',
      };
    }

    // Update the session in the database with the new activeProductId
    await prisma.session.update({
      where: {
        id: session.session.id,
      },
      data: {
        activeProductId: productId,
      },
    });

    await auth.api.getSession({
      query: {
        disableCookieCache: true,
      },
      headers: await headers(), // pass the headers
    });

    return { success: true, activeProductId: productId };
  } catch (error) {
    console.error('Error switching product:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to switch product',
    };
  }
}

export default switchProduct;
