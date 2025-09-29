'use server';

import { auth } from '@workspace/auth/server';
import prisma from '@workspace/db/prisma/client';
import { headers } from 'next/headers';
import getSession from '../get-session';

export async function getProducts() {
  const session = await getSession();

  return prisma.product.findMany({
    where: {
      organizationId: (session?.session as any)?.activeOrganizationId!,
    },
    include: {
      subscription: true,
    },
  });
}

export default getProducts;
