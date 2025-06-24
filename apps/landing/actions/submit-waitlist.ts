'use server';

import { db } from '@workspace/db';
import { waitlist } from '@workspace/db/schema';

export async function submitWaitlist(email: string) {
  await db
    .insert(waitlist)
    .values({
      email,
    })
    .onConflictDoNothing();
}
