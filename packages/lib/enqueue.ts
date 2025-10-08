'use server';
import ky from 'ky';

import { QueueInputSchema } from './dtos';
export async function enqueue(props: QueueInputSchema) {
  const { apiUrl, body } = QueueInputSchema.parse(props);

  const res = await ky.post(`${process.env.WORKER_API_URL}/api/generic-queue`, {
    headers: {
      Authorization: `Bearer ${process.env.WORKER_SECRET}`,
    },
    json: {
      apiUrl,
      body,
    } as QueueInputSchema,
  });

  return res.json();
}

export type QueueResponse = NonNullable<Awaited<ReturnType<typeof enqueue>>>;

export default enqueue;
