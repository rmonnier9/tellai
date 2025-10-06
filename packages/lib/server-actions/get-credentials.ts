'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function getCredentials() {
  const session = await getSession();

  if (!session?.session) {
    throw new Error('Unauthorized');
  }

  const activeProductId = (session.session as any).activeProductId;

  if (!activeProductId) {
    return [];
  }

  return prisma.credential.findMany({
    where: {
      productId: activeProductId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getCredential(id: string) {
  const session = await getSession();

  if (!session?.session) {
    throw new Error('Unauthorized');
  }

  const activeProductId = (session.session as any).activeProductId;

  return prisma.credential.findFirst({
    where: {
      id,
      productId: activeProductId,
    },
  });
}

export default getCredentials;
