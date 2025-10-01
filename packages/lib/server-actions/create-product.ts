'use server';

import prisma from '@workspace/db/prisma/client';
import { CreateProductSchema } from '../dtos';
import getSession from '../get-session';

// import { ApiError, ApiErrorType } from '../api-error';
// import { internalAppName, isArtApp, privateOnlyPipelines } from '../config';
// import getSession from '../get-session';
// import { GetGallery } from '../types/dtos';

export async function createProduct(props: CreateProductSchema) {
  const session = await getSession();

  if (!session?.session) {
    throw new Error('No session found');
  }

  // Type assertion since we know activeOrganizationId exists from the auth config
  const sessionWithOrgId = session.session as typeof session.session & {
    activeOrganizationId?: string;
  };

  if (!sessionWithOrgId.activeOrganizationId) {
    throw new Error('No active organization found');
  }

  const { name, description, url } = CreateProductSchema.parse(props);

  return prisma.product.create({
    data: {
      name,
      url,
      description: description ?? '',
      organization: {
        connect: {
          id: sessionWithOrgId.activeOrganizationId,
        },
      },
    },
  });
}

export default createProduct;
