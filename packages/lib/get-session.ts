import { auth } from '@workspace/auth/server';
import { headers } from 'next/headers';

export const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
};

export default getSession;
