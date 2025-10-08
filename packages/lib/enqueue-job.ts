'use server';
import prisma, { JobType } from '@workspace/db/prisma/client';

import { EnqueueJobSchema } from './dtos';
import enqueue from './enqueue';
export async function enqueueJob(props: EnqueueJobSchema) {
  const { jobType, productId, articleId, userId } =
    EnqueueJobSchema.parse(props);

  const job = await prisma.job.create({
    data: {
      type: jobType as JobType,
      ...(productId && {
        product: {
          connect: {
            id: productId,
          },
        },
      }),
      ...(articleId && {
        article: {
          connect: {
            id: articleId,
          },
        },
      }),
      ...(userId && {
        user: {
          connect: {
            id: userId,
          },
        },
      }),
    },
  });

  try {
    await enqueue({
      apiUrl: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/api/jobs/run`,
      body: {
        jobId: job?.id,
      },
    });
  } catch (error) {
    console.error(error);
    await prisma.job.update({
      where: { id: job?.id },
      data: {
        status: 'error',
        error: `${error}`,
      },
    });
  }

  return job?.id;
}

export type QueueResponse = NonNullable<Awaited<ReturnType<typeof enqueueJob>>>;

export default enqueueJob;
