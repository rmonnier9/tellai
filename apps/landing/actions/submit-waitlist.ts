'use server';

import { db, prisma } from '@workspace/db';
import { waitlist } from '@workspace/db/drizzle/schema';

export async function submitWaitlist(email: string) {
  // await db
  //   .insert(waitlist)
  //   .values({
  //     email,
  //   })
  //   .onConflictDoNothing();

  await prisma.waitlist.upsert({
    where: { email },
    create: { email },
    update: {},
  });
}
