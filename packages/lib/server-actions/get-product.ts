'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function getProduct({ id }: { id: string }) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return prisma.product.findUnique({
    where: {
      id: id,
    },
    include: {
      subscription: true,
    },
  });
}

export default getProduct;
