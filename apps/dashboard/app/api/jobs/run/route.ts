import { NextRequest, NextResponse } from 'next/server';
import prisma from '@workspace/db/prisma/client';
import { contentPlanner } from '@workspace/lib/jobs/content-planner';

export async function POST(request: NextRequest) {
  const { jobId } = (await request.json()) as { jobId: string };

  try {
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'running',
      },
    });

    switch (job.type) {
      case 'content_planner':
        await contentPlanner(job);
        break;
      default:
        throw new Error('Invalid job type');
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'done',
      },
    });

    return NextResponse.json({ message: 'Job run' }, { status: 200 });
  } catch (error) {
    console.error(error);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'error',
        error: `${error}`,
      },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
