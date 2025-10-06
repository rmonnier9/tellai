import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';

import { env } from 'hono/adapter';

import type { QueueInputSchema } from '@workspace/lib/dtos';

type Environment = {
  readonly GENERIC_QUEUE: Queue<QueueInputSchema>;
  WORKER_SECRET: string;
  NEXT_PUBLIC_LANDING_PAGE_URL: string;
};

const app = new Hono<{
  Bindings: Environment;
}>();

// app.get('/', async (c) => {
//   const e = env<Environment>(c as any);

//   await e.GENERIC_QUEUE.send({
//     apiUrl: `${e.NEXT_PUBLIC_LANDING_PAGE_URL}/api/jobs/generate-video`,
//     body: {
//       id: '444444',
//     },
//   });

//   return c.json({ success: true });
// });

app.use('/api/*', async (c, next) => {
  const e = env<Environment>(c as any);
  const token = e.WORKER_SECRET;

  return bearerAuth({ token })(c, next);
});

app.post('/api/generic-queue', async (c) => {
  const e = env<Environment>(c as any);
  const body = (await c.req.json()) as QueueInputSchema;

  await e.GENERIC_QUEUE.send(body);

  return c.json({ success: true });
});

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<QueueInputSchema>, env: Environment) {
    const promises = [];
    for (const message of batch.messages) {
      promises.push(
        fetch(message.body.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.WORKER_SECRET}`,
          },
          body: JSON.stringify(message.body.body),
        }).catch(console.error)
      );
    }

    const r = await Promise.all(promises);

    console.log(`[CLOUDFLARE WORKER] DONE`, r);
  },
};
