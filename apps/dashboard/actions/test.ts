'use server';

import { prisma } from '@workspace/db';

export async function test() {
  const waitlist = await prisma.waitlist.findMany();
  return waitlist;
}
