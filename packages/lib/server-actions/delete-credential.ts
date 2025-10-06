'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function deleteCredential(id: string) {
  const session = await getSession();

  if (!session?.session) {
    throw new Error('Unauthorized');
  }

  const activeProductId = (session.session as any).activeProductId;

  // Verify the credential belongs to the active product
  const credential = await prisma.credential.findFirst({
    where: {
      id,
      productId: activeProductId,
    },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  return prisma.credential.delete({
    where: {
      id,
    },
  });
}

export default deleteCredential;
