'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function getActiveContentPlannerJob() {
  const session = await getSession();

  if (!session?.session) {
    return null;
  }

  const activeProductId = (session.session as any).activeProductId;

  if (!activeProductId) {
    return null;
  }

  // Find the first job that is either pending or running for the active product
  const job = await prisma.job.findFirst({
    where: {
      productId: activeProductId,
      type: 'content_planner',
      status: {
        in: ['pending', 'running'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return job;
}

export default getActiveContentPlannerJob;
