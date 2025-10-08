'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function getJob({ id }: { id: string }) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return prisma.job.findUnique({
    where: {
      id: id,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      //   article: {
      //     select: {
      //       id: true,
      //       title: true,
      //       keyword: true,
      //     },
      //   },
    },
  });
}

export default getJob;
