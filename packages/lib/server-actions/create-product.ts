'use server';

import React, { cache } from 'react';

import prisma from '@workspace/db/prisma/client';
import { CreateProductSchema } from '../dtos';
import getSession from '../get-session';

// import { ApiError, ApiErrorType } from '../api-error';
// import { internalAppName, isArtApp, privateOnlyPipelines } from '../config';
// import getSession from '../get-session';
// import { GetGallery } from '../types/dtos';

export async function createProduct(props: CreateProductSchema) {
  const session = await getSession();

  const { name, description, url } = CreateProductSchema.parse(props);

  return prisma.product.create({
    data: {
      name,
      url,
      description: description ?? '',
      organization: {
        connect: {
          id: session?.session?.activeOrganizationId!,
        },
      },
    },
  });
}

export default createProduct;
